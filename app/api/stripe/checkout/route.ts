// app/api/stripe/checkout/route.ts
// No changes needed — your checkout.ts is already correct.
// Keeping this file here for completeness with one small hardening fix:
// validate that userId is a non-empty string before sending to Stripe.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

export async function POST(req: NextRequest) {
  try {
    const { priceType, userId, userEmail } = await req.json()

    // ── Validate inputs ────────────────────────────────────────────────────
    if (!priceType || !userId || !userEmail) {
      console.error('❌ [checkout] Missing required fields:', { priceType, userId: !!userId, userEmail: !!userEmail })
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // CRITICAL: userId must be your custom users.id UUID (not the Supabase auth UID).
    // This is what subscriptions.user_id references.
    // Your pricing.tsx and subscription.tsx already look up appUser.id correctly.
    if (typeof userId !== 'string' || userId.length < 10) {
      console.error('❌ [checkout] userId looks invalid:', userId)
      return NextResponse.json({ error: 'Invalid userId — must be the custom users.id UUID' }, { status: 400 })
    }

    console.log(`[checkout] Creating session for userId=${userId} email=${userEmail} plan=${priceType}`)

    const amount = priceType === 'yearly' ? 4788 : 499

    // Reuse existing Stripe customer by email to avoid duplicates
    let customerId: string
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      console.log(`♻️  [checkout] Reusing Stripe customer: ${customerId}`)

      // Ensure the customer record has user_id in metadata (may be missing on old records)
      await stripe.customers.update(customerId, { metadata: { user_id: userId } })
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      console.log(`🆕 [checkout] Created Stripe customer: ${customerId}`)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: priceType === 'yearly' ? 'Pro Yearly Subscription' : 'Pro Monthly Subscription',
            },
            unit_amount: amount,
            recurring: {
              interval: priceType === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer: customerId,
      // ── metadata on the SESSION (used by checkout.session.completed) ──────
      metadata: {
        user_id: userId,
        plan:    priceType,
      },
      // ── metadata on the SUBSCRIPTION (used by all subscription.* events) ──
      // This is what makes invoice.payment_succeeded and subscription.updated
      // able to find user_id — without this, only checkout events have it.
      subscription_data: {
        metadata: {
          user_id: userId,
          plan:    priceType,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?success=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?cancelled=true`,
    })

    console.log(`✅ [checkout] Session created: ${session.id} → ${session.url?.slice(0, 60)}...`)
    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('❌ [checkout] Error:', err)
    return NextResponse.json({ error: err.message || 'Stripe checkout failed' }, { status: 500 })
  }
}
