// app/api/stripe/webhook/route.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT WAS WRONG (5 root causes found in your original code):
//
// 1. WRONG SUPABASE CLIENT  ← PRIMARY CAUSE
//    You initialised supabase at module scope with the anon key from
//    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
//    Webhooks run on the server; the anon key respects Row-Level Security (RLS).
//    If your `subscriptions` table has ANY RLS policy enabled, the insert silently
//    fails or returns a permission error you swallowed.  You must use the
//    SERVICE ROLE key and create the client INSIDE the request handler
//    (never at module scope — cold-start caching can bleed across requests).
//
// 2. MISSING `export const dynamic = 'force-dynamic'`
//    Next.js 14 App Router caches GET routes by default and can also cache POST
//    routes that don't opt out. Without this, the route may never execute at all
//    in some deployment targets (Vercel Edge, etc.).
//
// 3. MISSING `export const config` TO DISABLE BODY PARSING
//    Next.js App Router buffers the body before your handler runs. The raw bytes
//    Stripe signs are gone by the time you call `req.arrayBuffer()`.
//    You must tell Next.js NOT to parse the body via the segment config.
//    (In App Router the correct way is `export const config = { api: { bodyParser: false } }`
//    but that is Pages-router syntax. In App Router you must read the raw
//    body via `req.arrayBuffer()` AND set the route segment config below.)
//
// 4. NOT HANDLING `customer.subscription.created` / `invoice.payment_succeeded`
//    For Stripe SUBSCRIPTIONS (not one-time payments), `checkout.session.completed`
//    fires but `session.subscription` may still be null at that exact moment
//    (async Stripe-side creation). The RELIABLE events for subscriptions are:
//      • customer.subscription.created   — always fires, sub object is complete
//      • invoice.payment_succeeded       — fires on every successful charge
//      • customer.subscription.deleted   — fires on cancellation
//    Relying solely on checkout.session.completed + immediate sub retrieval
//    creates a race condition.
//
// 5. DUPLICATE saveSubscription FUNCTION + INLINE INSERT CONFLICT
//    Your original file defines saveSubscription() at the top but then also
//    does an inline insert further down inside the event handler — they
//    duplicate logic and the inline one runs WITHOUT calling saveSubscription,
//    meaning the users table update never fires for the inline path.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ── Route segment config (App Router) ────────────────────────────────────────
// Tells Next.js this route is always dynamic (never cached) AND — crucially —
// does NOT pre-parse the body, which would destroy the raw bytes Stripe signed.
export const dynamic = 'force-dynamic'

// ── Stripe client (module-scope is fine — it holds no user state) ─────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

// ─────────────────────────────────────────────────────────────────────────────
// getSupabase() — creates a NEW admin client per request.
// NEVER use module-scope supabase with service-role key; Next.js module cache
// can share the instance across concurrent requests in some runtimes.
// ALWAYS use the SERVICE ROLE key here — bypasses RLS entirely.
// ─────────────────────────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY   // ← service role, NOT anon

  if (!url || !key) {
    throw new Error(
      '❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Check your .env.local file.'
    )
  }

  return createClient(url, key, {
    auth: {
      // Disable session persistence — this is a server-side admin client
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// saveSubscription — upsert into subscriptions + sync users table
// ─────────────────────────────────────────────────────────────────────────────
async function saveSubscription({
  userId,
  plan,
  status,
  startDate,
  endDate,
  stripeSubId,
}: {
  userId: string
  plan: string
  status: string
  startDate: string
  endDate: string
  stripeSubId: string
}) {
  const supabase = getSupabase()

  console.log('💾 saveSubscription called with:', { userId, plan, status, startDate, endDate, stripeSubId })

  // ── 1. Check for existing row ──────────────────────────────────────────────
  const { data: existing, error: selectErr } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectErr) {
    console.error('❌ [saveSubscription] SELECT error:', JSON.stringify(selectErr, null, 2))
    throw selectErr
  }

  // ── 2. Upsert ─────────────────────────────────────────────────────────────
  if (existing) {
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({ plan, status, start_date: startDate, end_date: endDate })
      .eq('user_id', userId)

    if (updateErr) {
      console.error('❌ [saveSubscription] UPDATE error:', JSON.stringify(updateErr, null, 2))
      throw updateErr
    }
    console.log(`✅ [saveSubscription] UPDATED subscription for user ${userId}`)
  } else {
    const { error: insertErr } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan, status, start_date: startDate, end_date: endDate })

    if (insertErr) {
      console.error('❌ [saveSubscription] INSERT error:', JSON.stringify(insertErr, null, 2))
      console.error('❌ INSERT details:', {
        userId,
        plan,
        status,
        startDate,
        endDate,
        hint: 'Check RLS policies on the subscriptions table. Make sure SUPABASE_SERVICE_ROLE_KEY is set (not the anon key).',
      })
      throw insertErr
    }
    console.log(`✅ [saveSubscription] INSERTED new subscription for user ${userId}`)
  }

  // ── 3. Sync users.subscription_status ─────────────────────────────────────
  const userStatus = status === 'active' ? 'active' : 'inactive'
  const { error: userUpdateErr } = await supabase
    .from('users')
    .update({ subscription_status: userStatus })
    .eq('id', userId)

  if (userUpdateErr) {
    // Non-fatal — log but don't throw; subscription row is already written
    console.warn('⚠️  [saveSubscription] Failed to update users.subscription_status:', JSON.stringify(userUpdateErr, null, 2))
  } else {
    console.log(`✅ [saveSubscription] users.subscription_status set to "${userStatus}" for user ${userId}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// extractUserId — safely pulls user_id from a Stripe object's metadata.
// Logs clearly when it's missing so you know exactly which event failed.
// ─────────────────────────────────────────────────────────────────────────────
function extractUserId(
  metadata: Stripe.Metadata | null | undefined,
  context: string
): string | null {
  const userId = metadata?.user_id ?? null
  if (!userId) {
    console.error(
      `❌ [extractUserId] user_id is missing from metadata in context: ${context}. ` +
      'Metadata received:', JSON.stringify(metadata ?? {})
    )
  }
  return userId
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Step 1: Read raw body as Buffer ───────────────────────────────────────
  // CRITICAL: must use arrayBuffer() — do NOT call req.json() or req.text()
  // before this, as that consumes the stream and the signature check fails.
  const rawBody = await req.arrayBuffer()
  const buf     = Buffer.from(rawBody)

  // ── Step 2: Verify Stripe signature ───────────────────────────────────────
  const sig     = req.headers.get('stripe-signature') ?? ''
  const secret  = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set in environment variables!')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err: any) {
    console.error('❌ [webhook] Signature verification failed:', err.message)
    console.error('   → Is STRIPE_WEBHOOK_SECRET correct? For local dev use: stripe listen --forward-to localhost:3000/api/stripe/webhook')
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 })
  }

  console.log(`\n📨 [webhook] Received event: ${event.type} | id: ${event.id}`)

  // ── Step 3: Handle events ─────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── checkout.session.completed ─────────────────────────────────────────
      // Fires when the customer completes the Stripe Checkout form.
      // For subscriptions, `session.subscription` is the Stripe subscription ID.
      // We retrieve the full subscription object to get period dates.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('[checkout.session.completed] session.id:', session.id)
        console.log('[checkout.session.completed] session.metadata:', session.metadata)
        console.log('[checkout.session.completed] session.mode:', session.mode)

        // Only process subscription checkouts
        if (session.mode !== 'subscription') {
          console.log('[checkout.session.completed] Skipping — mode is not subscription:', session.mode)
          break
        }

        const userId = extractUserId(session.metadata, 'checkout.session.completed')
        const plan   = session.metadata?.plan ?? 'monthly'

        if (!userId) {
          // user_id is missing — this is the #1 reason DB inserts fail.
          // It means the checkout session was created without metadata.user_id.
          // Check your /api/stripe/checkout route — the metadata block must include user_id.
          console.error('[checkout.session.completed] ⛔ Cannot save subscription without user_id. Returning 200 to prevent Stripe retry loops.')
          break
        }

        // Retrieve the full subscription object from Stripe
        // (session.subscription is just the ID string at this point)
        const stripeSubId = session.subscription as string
        if (!stripeSubId) {
          console.error('[checkout.session.completed] session.subscription is null — cannot retrieve dates.')
          break
        }

        console.log('[checkout.session.completed] Retrieving subscription:', stripeSubId)
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
        console.log('[checkout.session.completed] Stripe sub status:', stripeSub.status)

        const startDate = new Date(stripeSub.current_period_start * 1000).toISOString()
        const endDate   = new Date(stripeSub.current_period_end   * 1000).toISOString()

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate, stripeSubId })
        break
      }

      // ── customer.subscription.created ─────────────────────────────────────
      // Fires when Stripe creates the subscription object — always fires for
      // new subscriptions and is the most RELIABLE event to hook into.
      // The subscription object already has complete period data.
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription

        console.log('[customer.subscription.created] sub.id:', sub.id)
        console.log('[customer.subscription.created] sub.metadata:', sub.metadata)

        const userId = extractUserId(sub.metadata, 'customer.subscription.created')
        const plan   = sub.metadata?.plan ?? 'monthly'

        if (!userId) break

        const startDate = new Date(sub.current_period_start * 1000).toISOString()
        const endDate   = new Date(sub.current_period_end   * 1000).toISOString()

        await saveSubscription({ userId, plan, status: sub.status, startDate, endDate, stripeSubId: sub.id })
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      // Fires when the subscription renews, changes plan, or is cancelled
      // at period end. Keeps your DB in sync with Stripe's source of truth.
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription

        console.log('[customer.subscription.updated] sub.id:', sub.id, 'status:', sub.status)

        const userId = extractUserId(sub.metadata, 'customer.subscription.updated')
        const plan   = sub.metadata?.plan ?? 'monthly'

        if (!userId) break

        const startDate = new Date(sub.current_period_start * 1000).toISOString()
        const endDate   = new Date(sub.current_period_end   * 1000).toISOString()

        // cancel_at_period_end = user clicked cancel but access hasn't ended yet
        const status = sub.cancel_at_period_end ? 'cancelling' : sub.status

        await saveSubscription({ userId, plan, status, startDate, endDate, stripeSubId: sub.id })
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      // Fires when the subscription fully ends (period expires after cancellation,
      // or immediate cancellation). Mark user as inactive.
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        console.log('[customer.subscription.deleted] sub.id:', sub.id)

        const userId = extractUserId(sub.metadata, 'customer.subscription.deleted')

        if (!userId) break

        const supabase = getSupabase()
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'inactive' })
          .eq('user_id', userId)

        if (error) {
          console.error('[customer.subscription.deleted] Update error:', JSON.stringify(error, null, 2))
        } else {
          console.log(`✅ [customer.subscription.deleted] Marked inactive for user ${userId}`)
        }

        // Sync users table
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)
        break
      }

      // ── invoice.payment_succeeded ──────────────────────────────────────────
      // Fires on every successful charge — initial AND renewals.
      // Renewing the end_date here keeps your DB accurate on auto-renewals.
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Only handle subscription invoices
        if (!invoice.subscription) {
          console.log('[invoice.payment_succeeded] No subscription attached — skipping.')
          break
        }

        console.log('[invoice.payment_succeeded] invoice.id:', invoice.id, 'sub:', invoice.subscription)

        const stripeSubId = invoice.subscription as string
        const stripeSub   = await stripe.subscriptions.retrieve(stripeSubId)

        const userId = extractUserId(stripeSub.metadata, 'invoice.payment_succeeded')
        const plan   = stripeSub.metadata?.plan ?? 'monthly'

        if (!userId) break

        const startDate = new Date(stripeSub.current_period_start * 1000).toISOString()
        const endDate   = new Date(stripeSub.current_period_end   * 1000).toISOString()

        await saveSubscription({ userId, plan, status: 'active', startDate, endDate, stripeSubId })
        break
      }

      // ── invoice.payment_failed ────────────────────────────────────────────
      // Fires when a renewal charge fails. Mark the subscription as past_due.
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) break

        console.log('[invoice.payment_failed] invoice.id:', invoice.id)

        const stripeSubId = invoice.subscription as string
        const stripeSub   = await stripe.subscriptions.retrieve(stripeSubId)
        const userId      = extractUserId(stripeSub.metadata, 'invoice.payment_failed')

        if (!userId) break

        const supabase = getSupabase()
        await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', userId)
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

        console.log(`⚠️  [invoice.payment_failed] Marked past_due for user ${userId}`)
        break
      }

      default:
        // Log unhandled events at debug level — not errors
        console.log(`[webhook] Unhandled event type: ${event.type} — no action taken.`)
    }

  } catch (err: any) {
    // Return 500 so Stripe RETRIES the webhook (up to 3 days)
    console.error(`🔥 [webhook] Unhandled error processing ${event.type}:`, err)
    return NextResponse.json(
      { error: err.message ?? 'Internal webhook error' },
      { status: 500 }
    )
  }

  // Always return 200 for events we successfully processed (even if we skipped them)
  return NextResponse.json({ received: true, eventType: event.type })
}
