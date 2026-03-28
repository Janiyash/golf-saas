// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ── Required for Next.js App Router — disables caching on this route ──────────
export const dynamic = 'force-dynamic'

// ── Stripe client ─────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

// ── Supabase admin client factory ─────────────────────────────────────────────
// Created per-call with SERVICE ROLE key — bypasses RLS entirely.
// NEVER use the anon key here — it will be silently blocked by RLS.
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getPeriodDates
// ✅ Casts to `any` to avoid TS2339 "Property does not exist on Subscription"
//    current_period_start/end exist at runtime in all Stripe SDK versions
//    but TypeScript types them differently across versions.
// ─────────────────────────────────────────────────────────────────────────────
function getPeriodDates(sub: Stripe.Subscription): { startDate: string; endDate: string } {
  const s = sub as any
  return {
    startDate: new Date(s.current_period_start * 1000).toISOString(),
    endDate:   new Date(s.current_period_end   * 1000).toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getSubId
// ✅ invoice.subscription can be string | Stripe.Subscription | null
//    depending on SDK version and whether the object is expanded.
// ─────────────────────────────────────────────────────────────────────────────
function getSubId(subscription: string | Stripe.Subscription | null | undefined): string | null {
  if (!subscription) return null
  if (typeof subscription === 'string') return subscription
  return (subscription as any).id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// retrieveSubWithRetry
// Stripe fires checkout.session.completed BEFORE the subscription object is
// sometimes ready. Retry up to 4x with back-off to always get period dates.
// ─────────────────────────────────────────────────────────────────────────────
async function retrieveSubWithRetry(stripeSubId: string): Promise<Stripe.Subscription> {
  let lastErr: any
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubId)
      if (sub?.id) return sub
    } catch (err: any) {
      lastErr = err
      console.warn(`⚠️ retrieveSub attempt ${attempt}/4: ${err.message}`)
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  throw lastErr ?? new Error(`Could not retrieve subscription: ${stripeSubId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// saveSubscription
// Single function handles: new subscriber / plan upgrade / renewal
// ─────────────────────────────────────────────────────────────────────────────
async function saveSubscription({
  userId,
  plan,
  status,
  startDate,
  endDate,
}: {
  userId:    string
  plan:      string
  status:    string
  startDate: string
  endDate:   string
}) {
  const supabase = getSupabase()

  console.log('💾 saveSubscription →', { userId, plan, status, startDate, endDate })

  const { data: existing, error: selectErr } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectErr) {
    console.error('❌ SELECT error:', JSON.stringify(selectErr, null, 2))
    throw selectErr
  }

  if (existing) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan, status, start_date: startDate, end_date: endDate })
      .eq('user_id', userId)

    if (error) { console.error('❌ UPDATE error:', JSON.stringify(error, null, 2)); throw error }
    console.log(`✅ UPDATED — user:${userId} plan:${plan}`)
  } else {
    const { error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan, status, start_date: startDate, end_date: endDate })

    if (error) {
      console.error('❌ INSERT error:', JSON.stringify(error, null, 2))
      console.error('   → Is SUPABASE_SERVICE_ROLE_KEY set? (not the anon key)')
      console.error('   → Check RLS on the subscriptions table')
      throw error
    }
    console.log(`✅ INSERTED — user:${userId} plan:${plan}`)
  }

  const userStatus = status === 'active' ? 'active' : 'inactive'
  const { error: userErr } = await supabase
    .from('users')
    .update({ subscription_status: userStatus })
    .eq('id', userId)

  if (userErr) console.warn('⚠️ users sync failed:', JSON.stringify(userErr, null, 2))
  else         console.log(`✅ users.subscription_status = "${userStatus}" — user:${userId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — main webhook handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {

  // In Next.js App Router, req.text() returns the raw unparsed body.
  // Do NOT call req.json() — it re-parses and breaks Stripe signature verification.
  // The old `export const config = { api: { bodyParser: false } }` is Pages Router
  // syntax ONLY — it does absolutely nothing inside the app/ directory.
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not set in .env.local')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('❌ Stripe signature failed:', err.message)
    return NextResponse.json({ error: `Signature error: ${err.message}` }, { status: 400 })
  }

  console.log(`\n📨 ${event.type} | id:${event.id}`)

  try {
    switch (event.type) {

      // ── checkout.session.completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('[checkout.session.completed] metadata:', JSON.stringify(session.metadata))

        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        const plan   = session.metadata?.plan

        if (!userId || !plan) {
          console.error('❌ Missing user_id or plan in session.metadata:', JSON.stringify(session.metadata))
          break // return 200 — metadata was never set at checkout creation, retrying won't help
        }

        const stripeSubId = getSubId(session.subscription)
        if (!stripeSubId) { console.error('❌ No subscription ID on session'); break }

        const stripeSub              = await retrieveSubWithRetry(stripeSubId)
        const { startDate, endDate } = getPeriodDates(stripeSub)

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── customer.subscription.created ─────────────────────────────────────
      // Most reliable event — sub object is always complete here.
      // Acts as a safety net if checkout.session.completed was missed.
      case 'customer.subscription.created': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'

        console.log('[customer.subscription.created] metadata:', JSON.stringify(sub.metadata))

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const { startDate, endDate } = getPeriodDates(sub)
        await saveSubscription({ userId, plan, status: sub.status, startDate, endDate })
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      // Fires on: plan upgrade, renewal, cancel-at-period-end toggle.
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'

        console.log('[customer.subscription.updated] sub.id:', sub.id, 'status:', sub.status)

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const { startDate, endDate } = getPeriodDates(sub)
        const status = sub.cancel_at_period_end ? 'cancelling' : sub.status

        await saveSubscription({ userId, plan, status, startDate, endDate })
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

        console.log(`✅ Cancelled — user:${userId}`)
        break
      }

      // ── invoice.payment_succeeded / invoice.paid ───────────────────────────
      // Fires on every successful charge. Reliable fallback to ensure DB is written
      // even if checkout.session.completed failed.
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice     = event.data.object as any
        const stripeSubId = getSubId(invoice.subscription)

        if (!stripeSubId) { console.warn(`[${event.type}] No subscription ID — skipping`); break }

        const stripeSub              = await stripe.subscriptions.retrieve(stripeSubId)
        const userId                 = stripeSub.metadata?.user_id
        const plan                   = stripeSub.metadata?.plan ?? 'monthly'
        const { startDate, endDate } = getPeriodDates(stripeSub)  // ✅ no TS error

        if (!userId) { console.warn(`[${event.type}] No user_id in sub metadata — skipping`); break }

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── invoice.payment_failed ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice     = event.data.object as any
        const stripeSubId = getSubId(invoice.subscription)
        if (!stripeSubId) break

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
        const userId    = stripeSub.metadata?.user_id
        if (!userId) break

        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

        console.log(`⚠️ Payment failed — marked past_due for user:${userId}`)
        break
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`)
    }

  } catch (err: any) {
    // Return 500 so Stripe RETRIES this event (retries for up to 3 days)
    console.error(`🔥 Error in ${event.type}:`, err.message)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true, eventType: event.type })
}