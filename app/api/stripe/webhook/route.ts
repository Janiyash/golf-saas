// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any,
})

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('❌ Missing Supabase env vars')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── getPeriodDates ─────────────────────────────────────────────────────────────
// Handles both old API (top-level) and new 2026 API (nested under items)
function getPeriodDates(sub: any): { startDate: string; endDate: string } {
  const periodStart =
    sub.current_period_start ??
    sub.items?.data?.[0]?.current_period_start

  const periodEnd =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end

  return {
    startDate: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
    endDate:   periodEnd   ? new Date(periodEnd   * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function getSubId(subscription: any): string | null {
  if (!subscription) return null
  if (typeof subscription === 'string') return subscription
  return subscription.id ?? null
}

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

async function saveSubscription({
  userId, plan, status, startDate, endDate,
}: {
  userId: string; plan: string; status: string; startDate: string; endDate: string
}) {
  const supabase = getSupabase()
  console.log('💾 saveSubscription →', { userId, plan, status, startDate, endDate })

  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      { user_id: userId, plan, status, start_date: startDate, end_date: endDate },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('❌ UPSERT error:', JSON.stringify(error, null, 2))
    throw error
  }
  console.log(`✅ Subscription UPSERTED — user:${userId} plan:${plan}`)

  const userStatus = status === 'active' ? 'active' : 'inactive'
  const { error: userErr } = await supabase
    .from('users')
    .update({ subscription_status: userStatus })
    .eq('id', userId)

  if (userErr) console.warn('⚠️ users sync failed:', JSON.stringify(userErr, null, 2))
  else console.log(`✅ users.subscription_status = "${userStatus}" — user:${userId}`)
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    console.error('❌ Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not set in Vercel env vars')
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
        const session = event.data.object as any
        console.log('[checkout.session.completed] metadata:', JSON.stringify(session.metadata))
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        const plan   = session.metadata?.plan
        if (!userId || !plan) {
          console.error('❌ Missing user_id or plan in session.metadata:', JSON.stringify(session.metadata))
          break
        }

        const stripeSubId = getSubId(session.subscription)
        if (!stripeSubId) { console.error('❌ No subscription ID on session'); break }

        const stripeSub              = await retrieveSubWithRetry(stripeSubId)
        const { startDate, endDate } = getPeriodDates(stripeSub)
        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── customer.subscription.created ─────────────────────────────────────
      case 'customer.subscription.created': {
        const sub    = event.data.object as any
        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'
        console.log('[subscription.created] metadata:', JSON.stringify(sub.metadata))
        if (!userId) { console.error('❌ user_id missing'); break }
        const { startDate, endDate } = getPeriodDates(sub)
        await saveSubscription({ userId, plan, status: sub.status, startDate, endDate })
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub    = event.data.object as any
        const userId = sub.metadata?.user_id
        const plan   = sub.metadata?.plan ?? 'monthly'
        console.log('[subscription.updated] sub.id:', sub.id, 'status:', sub.status)
        if (!userId) { console.error('❌ user_id missing'); break }
        const { startDate, endDate } = getPeriodDates(sub)
        const status = sub.cancel_at_period_end ? 'cancelling' : sub.status
        await saveSubscription({ userId, plan, status, startDate, endDate })
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as any
        const userId = sub.metadata?.user_id
        if (!userId) { console.error('❌ user_id missing'); break }
        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)
        console.log(`✅ Cancelled — user:${userId}`)
        break
      }

      // ── invoice.payment_succeeded ──────────────────────────────────────────
      // ── invoice.paid ──────────────────────────────────────────────────────
      // ── invoice_payment.paid  ← NEW in Stripe API 2026-02-25.clover ───────
      //    THIS IS THE KEY FIX: Stripe renamed the event in your API version.
      //    Your account sends 'invoice_payment.paid' not 'invoice.paid'.
      case 'invoice_payment.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice     = event.data.object as any
        console.log(`[${event.type}] invoice id:`, invoice.id)
        console.log(`[${event.type}] invoice keys:`, Object.keys(invoice))

        // ✅ FIX: In the new 2026 API, invoice_payment object uses 'payment' 
        //    field instead of 'subscription'. Check both.
        const stripeSubId =
          getSubId(invoice.subscription) ??
          getSubId(invoice.payment?.subscription) ??
          getSubId(invoice.subscription_details?.subscription)

        if (!stripeSubId) {
          console.warn(`[${event.type}] No subscription ID found on invoice — skipping`)
          break
        }

        const stripeSub              = await stripe.subscriptions.retrieve(stripeSubId) as any
        const userId                 = stripeSub.metadata?.user_id
        const plan                   = stripeSub.metadata?.plan ?? 'monthly'
        const { startDate, endDate } = getPeriodDates(stripeSub)

        if (!userId) {
          console.warn(`[${event.type}] No user_id in subscription metadata — skipping`)
          break
        }

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate })
        break
      }

      // ── invoice.payment_failed ─────────────────────────────────────────────
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
    console.error(`🔥 Error in ${event.type}:`, err.message)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true, eventType: event.type })
}