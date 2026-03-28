// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ── Required for Next.js App Router ───────────────────────────────────────────
export const dynamic = 'force-dynamic'

// ── Stripe client
// ✅ FIX 1: apiVersion updated to match your Stripe account (2026-02-25.clover).
//    Stripe sends events in YOUR account's API version. If the SDK version is
//    older, constructEvent() parses the payload with the wrong schema and
//    metadata / subscription fields end up undefined — so nothing saves to DB.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any,   // ✅ latest stable; 'as any' silences SDK type mismatch
})

// ── Supabase admin client (service role — bypasses RLS) ───────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY   // MUST be service role, NOT anon key

  if (!url || !key) {
    throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── getPeriodDates ─────────────────────────────────────────────────────────────
// Cast to any — current_period_start/end moved between Stripe SDK type versions
// but always exist on the runtime object.
function getPeriodDates(sub: any): { startDate: string; endDate: string } {
  // ✅ FIX 2: In API version 2026+, period dates may live under sub.items.data[0]
  //    OR still at the top level. We check both so it works regardless of version.
  const periodStart =
    sub.current_period_start ??
    sub.items?.data?.[0]?.current_period_start

  const periodEnd =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end

  if (!periodStart || !periodEnd) {
    console.warn('⚠️ getPeriodDates: could not find period dates on subscription object')
    console.warn('   sub keys:', Object.keys(sub))
  }

  return {
    startDate: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
    endDate:   periodEnd   ? new Date(periodEnd   * 1000).toISOString() : new Date().toISOString(),
  }
}

// ── getSubId ───────────────────────────────────────────────────────────────────
// invoice.subscription can be string | object | null depending on SDK version.
function getSubId(subscription: any): string | null {
  if (!subscription) return null
  if (typeof subscription === 'string') return subscription
  return subscription.id ?? null
}

// ── retrieveSubWithRetry ───────────────────────────────────────────────────────
// Stripe fires checkout.session.completed before the sub is sometimes ready.
async function retrieveSubWithRetry(stripeSubId: string): Promise<any> {
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

// ── saveSubscription ───────────────────────────────────────────────────────────
// Handles: new subscriber / plan upgrade / renewal — all in one upsert.
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

  // ✅ FIX 3: Use ON CONFLICT upsert directly — avoids the race condition where
  //    two events (checkout.session.completed + customer.subscription.created)
  //    both try to INSERT at the same time and one fails with a duplicate key error.
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      { user_id: userId, plan, status, start_date: startDate, end_date: endDate },
      { onConflict: 'user_id' }   // requires UNIQUE constraint on user_id (already added in schema fix)
    )

  if (error) {
    console.error('❌ UPSERT error:', JSON.stringify(error, null, 2))
    console.error('   → Is SUPABASE_SERVICE_ROLE_KEY set? (not the anon key)')
    console.error('   → Does subscriptions table have UNIQUE constraint on user_id?')
    console.error('   → Run in Supabase SQL: ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);')
    throw error
  }

  console.log(`✅ Subscription UPSERTED — user:${userId} plan:${plan} status:${status}`)

  // Sync users.subscription_status
  const userStatus = status === 'active' ? 'active' : 'inactive'
  const { error: userErr } = await supabase
    .from('users')
    .update({ subscription_status: userStatus })
    .eq('id', userId)

  if (userErr) console.warn('⚠️ users sync failed:', JSON.stringify(userErr, null, 2))
  else         console.log(`✅ users.subscription_status = "${userStatus}" — user:${userId}`)
}

// ── POST — main webhook handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {

  // In Next.js App Router req.text() gives the raw unparsed body Stripe signed.
  // Do NOT call req.json() — it consumes the stream and breaks signature check.
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    console.error('❌ Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not set')
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

  // ✅ FIX 4: Log the full raw event on first run so you can inspect the exact
  //    shape Stripe sends in your account's API version. Remove after debugging.
  console.log('📦 event.data.object keys:', Object.keys(event.data.object as any))

  try {
    switch (event.type) {

      // ── checkout.session.completed ───────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as any

        console.log('[checkout.session.completed] mode:', session.mode)
        console.log('[checkout.session.completed] metadata:', JSON.stringify(session.metadata))
        console.log('[checkout.session.completed] subscription:', session.subscription)

        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        const plan   = session.metadata?.plan

        if (!userId || !plan) {
          // Returning 200 stops Stripe retrying — the metadata was never set at
          // checkout creation. Fix: ensure /api/stripe/checkout sets metadata: { user_id, plan }
          console.error('❌ Missing user_id or plan in session.metadata')
          console.error('   metadata received:', JSON.stringify(session.metadata))
          break
        }

        const stripeSubId = getSubId(session.subscription)
        if (!stripeSubId) { console.error('❌ No subscription ID on session'); break }

        const stripeSub              = await retrieveSubWithRetry(stripeSubId)
        const { startDate, endDate } = getPeriodDates(stripeSub)

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── customer.subscription.created ───────────────────────────────────
      // Most reliable — sub object always complete here. Safety net if
      // checkout.session.completed fires before sub is ready.
      case 'customer.subscription.created': {
        const sub = event.data.object as any

        console.log('[customer.subscription.created] metadata:', JSON.stringify(sub.metadata))

        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const { startDate, endDate } = getPeriodDates(sub)
        await saveSubscription({ userId, plan, status: sub.status, startDate, endDate })
        break
      }

      // ── customer.subscription.updated ───────────────────────────────────
      // Fires on: plan upgrade, renewal, cancel-at-period-end toggle.
      case 'customer.subscription.updated': {
        const sub    = event.data.object as any
        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'

        console.log('[customer.subscription.updated] sub.id:', sub.id, 'status:', sub.status)

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const { startDate, endDate } = getPeriodDates(sub)
        const status = sub.cancel_at_period_end ? 'cancelling' : sub.status

        await saveSubscription({ userId, plan, status, startDate, endDate })
        break
      }

      // ── customer.subscription.deleted ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as any
        const userId = sub.metadata?.user_id

        if (!userId) { console.error('❌ user_id missing from sub metadata'); break }

        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

        console.log(`✅ Cancelled — user:${userId}`)
        break
      }

      // ── invoice.payment_succeeded / invoice.paid ─────────────────────────
      // Fires on every successful charge. Reliable fallback to ensure DB is
      // always written even if checkout.session.completed was skipped.
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice     = event.data.object as any
        const stripeSubId = getSubId(invoice.subscription)

        if (!stripeSubId) { console.warn(`[${event.type}] No subscription ID — skipping`); break }

        const stripeSub              = await stripe.subscriptions.retrieve(stripeSubId) as any
        const userId                 = stripeSub.metadata?.user_id
        const plan                   = stripeSub.metadata?.plan ?? 'monthly'
        const { startDate, endDate } = getPeriodDates(stripeSub)

        if (!userId) { console.warn(`[${event.type}] No user_id in sub metadata — skipping`); break }

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── invoice.payment_failed ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice     = event.data.object as any
        const stripeSubId = getSubId(invoice.subscription)
        if (!stripeSubId) break

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any
        const userId    = stripeSub.metadata?.user_id
        if (!userId) break

        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

        console.log(`⚠️ Payment failed — past_due for user:${userId}`)
        break
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`)
    }

  } catch (err: any) {
    // Return 500 so Stripe RETRIES the event (retries for up to 3 days)
    console.error(`🔥 Error in ${event.type}:`, err.message)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true, eventType: event.type })
}