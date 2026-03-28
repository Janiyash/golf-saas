'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavBar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function PricingPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isLoaded,        setIsLoaded]        = useState(false)
  const [annual,          setAnnual]          = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [toast,           setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const cursorRef    = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const h = (e: MouseEvent) => {
      if (cursorRef.current)    cursorRef.current.style.transform    = `translate(${e.clientX - 20}px,${e.clientY - 20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 4}px)`
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // Handle Stripe redirect back
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ msg: '🎉 Payment successful! Activating your subscription...', type: 'success' })
      // Give webhook time to write to DB, then redirect to subscription page
      setTimeout(() => { window.location.href = '/dashboard/subscription' }, 6000)
    }
    if (searchParams.get('cancelled') === 'true') {
      setToast({ msg: 'Payment cancelled. You can try again anytime.', type: 'error' })
    }
  }, [searchParams])

  // ── Checkout ──────────────────────────────────────────────────────────────
  // ✅ CRITICAL: always look up appUser.id from your custom users table.
  //    The users table uses its OWN uuid (not Supabase auth UID).
  //    subscriptions.user_id references users.id (your custom UUID).
  //    Passing user.id (auth UID) instead would save the subscription under
  //    the wrong ID and it would never appear on the dashboard.
  const handleCheckout = async (type: 'monthly' | 'yearly') => {
    setCheckoutLoading(type)
    try {
      // Step 1 — get auth session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Step 2 — get your custom users table UUID
      // Schema: users(id uuid, name, email, role, subscription_status, charity_id, charity_percentage)
      const { data: appUser, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userErr || !appUser) {
        setToast({ msg: 'User account not found. Please log out and back in.', type: 'error' })
        setCheckoutLoading(null)
        return
      }

      // Step 3 — call checkout with the CORRECT userId (custom users.id)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType: type,
          userId:    appUser.id,   // ✅ users.id — what subscriptions.user_id references
          userEmail: user.email,
        }),
      })

      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch {
        throw new Error('Server error — check API route logs.')
      }

      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (!data.url) throw new Error('Stripe URL not returned')

      window.location.href = data.url

    } catch (err: any) {
      console.error('Checkout error:', err)
      setToast({ msg: err.message || 'Something went wrong. Please try again.', type: 'error' })
      setCheckoutLoading(null)
    }
  }

  const features = [
    'Full score tracking (5-score rolling window)',
    'Monthly prize draw entry',
    'Charity contribution (min 10%)',
    'Performance analytics dashboard',
    'Winner verification & payout',
    'Unlimited score history export',
    'Priority support',
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--gold-dim:#8B6914;--green:#1A4A2E;--green-mid:#2D6A44;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--text-muted:#7A8A79;}
        html{cursor:none;} body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);overflow-x:hidden;}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .page-wrap{opacity:0;transition:opacity .6s ease;} .page-wrap.loaded{opacity:1;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .toast{position:fixed;top:80px;right:32px;z-index:9000;padding:14px 20px;font-size:.85rem;display:flex;align-items:center;gap:10px;animation:slideDown .25s ease;max-width:420px;box-shadow:0 8px 40px rgba(0,0,0,.5);}
        .toast.success{background:rgba(29,74,46,.97);border:1px solid rgba(61,186,110,.3);color:#6EE7A0;}
        .toast.error{background:rgba(60,10,10,.97);border:1px solid rgba(239,68,68,.3);color:#FCA5A5;}
        .toast-close{margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;font-size:16px;opacity:.7;padding:0 0 0 8px;}
        .toast-close:hover{opacity:1;}
        .hero{padding:160px 80px 80px;text-align:center;position:relative;background:radial-gradient(ellipse 70% 50% at 50% 30%,rgba(29,74,46,.3),transparent);}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(201,168,76,.3);padding:6px 16px;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:28px;}
        .eyebrow-dot{width:6px;height:6px;background:var(--green-bright);border-radius:50%;animation:pulse 2s infinite;}
        .hero-title{font-family:'Playfair Display',serif;font-size:clamp(3rem,6vw,5rem);font-weight:900;line-height:1.05;margin-bottom:16px;}
        .hero-title span{color:var(--gold);}
        .hero-sub{color:var(--text-muted);font-size:1.05rem;font-weight:300;max-width:500px;margin:0 auto 48px;line-height:1.7;}
        .toggle-wrap{display:inline-flex;align-items:center;gap:16px;background:var(--dark2);border:1px solid rgba(201,168,76,.1);padding:6px 20px;margin-bottom:60px;}
        .toggle-lbl{font-size:.85rem;color:var(--text-muted);transition:color .2s;}
        .toggle-lbl.active{color:var(--cream);}
        .toggle-switch{position:relative;width:48px;height:26px;cursor:pointer;}
        .toggle-switch input{opacity:0;width:0;height:0;}
        .toggle-slider{position:absolute;inset:0;background:rgba(201,168,76,.2);border:1px solid rgba(201,168,76,.3);transition:.3s;border-radius:26px;}
        .toggle-slider::before{content:'';position:absolute;width:18px;height:18px;left:3px;bottom:3px;background:var(--gold);border-radius:50%;transition:.3s;}
        input:checked+.toggle-slider{background:rgba(61,186,110,.2);border-color:rgba(61,186,110,.3);}
        input:checked+.toggle-slider::before{transform:translateX(22px);background:var(--green-bright);}
        .save-tag{background:rgba(61,186,110,.15);border:1px solid rgba(61,186,110,.25);color:var(--green-bright);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;}
        .pricing-section{padding:0 80px 100px;}
        .plans-wrap{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;}
        .plan-card{background:var(--dark2);border:1px solid rgba(201,168,76,.1);padding:48px 40px;position:relative;overflow:hidden;transition:all .3s;}
        .plan-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .plan-card.featured{border-color:rgba(201,168,76,.3);background:linear-gradient(135deg,rgba(29,74,46,.1),var(--dark2));}
        .plan-card.featured::before{background:linear-gradient(90deg,transparent,var(--gold),transparent);}
        .featured-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);color:var(--gold);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;padding:4px 12px;margin-bottom:24px;}
        .plan-name{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;margin-bottom:8px;}
        .plan-price-wrap{margin-bottom:8px;}
        .plan-price{font-family:'Playfair Display',serif;font-size:3.5rem;font-weight:900;color:var(--gold);line-height:1;}
        .plan-period{font-size:.9rem;color:var(--text-muted);}
        .plan-saving{font-size:.8rem;color:var(--green-bright);margin-bottom:32px;min-height:20px;}
        .plan-divider{height:1px;background:rgba(201,168,76,.08);margin-bottom:28px;}
        .plan-features{display:flex;flex-direction:column;gap:12px;margin-bottom:36px;}
        .feat-row{display:flex;align-items:center;gap:12px;font-size:.88rem;color:var(--cream);}
        .feat-dot{width:5px;height:5px;background:var(--green-bright);border-radius:50%;flex-shrink:0;}
        .btn-plan{width:100%;padding:14px;background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:transform .2s,box-shadow .3s;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-plan:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 50px rgba(201,168,76,.3);}
        .btn-plan:disabled{opacity:.6;cursor:not-allowed;}
        .btn-plan-outline{width:100%;padding:14px;background:none;border:1px solid rgba(201,168,76,.3);color:var(--gold);font-family:'DM Sans',sans-serif;font-size:.88rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-plan-outline:hover:not(:disabled){background:rgba(201,168,76,.06);border-color:rgba(201,168,76,.5);}
        .btn-plan-outline:disabled{opacity:.6;cursor:not-allowed;}
        .spinner{width:15px;height:15px;border:2px solid rgba(8,12,7,.3);border-top-color:var(--dark);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
        .spinner-gold{border-color:rgba(201,168,76,.2);border-top-color:var(--gold);}
        .faq-section{padding:80px;background:var(--dark2);border-top:1px solid rgba(201,168,76,.06);}
        .section-eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:12px;}
        .section-eyebrow::after{content:'';flex:1;max-width:40px;height:1px;background:var(--gold);opacity:.4;}
        .section-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,3.5vw,2.8rem);font-weight:900;line-height:1.1;margin-bottom:48px;}
        .faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
        .faq-item{padding:28px;background:var(--dark);border:1px solid rgba(201,168,76,.06);}
        .faq-q{font-size:.95rem;font-weight:500;color:var(--gold);margin-bottom:10px;}
        .faq-a{font-size:.85rem;color:var(--text-muted);line-height:1.7;}
        .footer{background:var(--dark2);border-top:1px solid rgba(201,168,76,.08);padding:40px 80px;text-align:center;}
        .footer-copy{font-size:.8rem;color:rgba(122,138,121,.5);}
        @media(max-width:1024px){.hero,.pricing-section,.faq-section,.footer{padding-left:40px;padding-right:40px;}.plans-wrap,.faq-grid{grid-template-columns:1fr;}}
        @media(max-width:480px){.toast{right:16px;left:16px;max-width:none;}}
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <NavBar />

      <div className={`page-wrap${isLoaded ? ' loaded' : ''}`}>
        <section className="hero">
          <div className="hero-eyebrow"><span className="eyebrow-dot" />Simple Pricing</div>
          <h1 className="hero-title">One plan.<br /><span>All features.</span></h1>
          <p className="hero-sub">No hidden fees. No tiers. Every player gets the full GolfCharity experience from day one.</p>
          <div className="toggle-wrap">
            <span className={`toggle-lbl${!annual ? ' active' : ''}`}>Monthly</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={annual} onChange={() => setAnnual(a => !a)} />
              <span className="toggle-slider" />
            </label>
            <span className={`toggle-lbl${annual ? ' active' : ''}`}>Annual</span>
            {annual && <span className="save-tag">Save £11.99</span>}
          </div>
        </section>

        <div className="pricing-section">
          <div className="plans-wrap">
            {/* Monthly */}
            <div className="plan-card">
              <div className="plan-name">Pro Monthly</div>
              <div className="plan-price-wrap">
                <span className="plan-price">£4.99</span>
                <span className="plan-period"> / month</span>
              </div>
              <div className="plan-saving">&nbsp;</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {features.map((f, i) => <div key={i} className="feat-row"><span className="feat-dot" />{f}</div>)}
              </div>
              <button
                className="btn-plan-outline"
                disabled={!!checkoutLoading}
                onClick={() => handleCheckout('monthly')}
              >
                {checkoutLoading === 'monthly'
                  ? <><div className="spinner spinner-gold" />Redirecting to Stripe...</>
                  : 'Start Monthly'}
              </button>
            </div>

            {/* Yearly */}
            <div className="plan-card featured">
              <div className="featured-badge">⭐ Best Value</div>
              <div className="plan-name">Pro Annual</div>
              <div className="plan-price-wrap">
                <span className="plan-price">£47.88</span>
                <span className="plan-period"> / year</span>
              </div>
              <div className="plan-saving">Equivalent to £3.99/mo — save £11.99</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {features.map((f, i) => <div key={i} className="feat-row"><span className="feat-dot" />{f}</div>)}
              </div>
              <button
                className="btn-plan"
                disabled={!!checkoutLoading}
                onClick={() => handleCheckout('yearly')}
              >
                {checkoutLoading === 'yearly'
                  ? <><div className="spinner" />Redirecting to Stripe...</>
                  : 'Start Annual — Best Value'}
              </button>
            </div>
          </div>
        </div>

        <section className="faq-section">
          <div className="section-eyebrow">Common Questions</div>
          <h2 className="section-title">Everything<br /><span style={{ color: 'var(--gold)' }}>answered.</span></h2>
          <div className="faq-grid">
            {[
              { q: 'Is there really a free first month?',            a: 'Yes. Your first month is completely free. No credit card required to sign up. Cancel before the month ends and pay nothing.' },
              { q: 'Can I cancel anytime?',                         a: 'Absolutely. Cancel from your dashboard at any time. No penalties, no questions asked.' },
              { q: 'How does the charity contribution work?',       a: 'A minimum of 10% of your subscription goes to your chosen charity monthly. You can increase this up to 50% in your dashboard.' },
              { q: "What happens if no one matches all 5 numbers?", a: 'The jackpot rolls over to the next month, growing until someone wins. The 3-match and 4-match prizes are always awarded.' },
              { q: 'How is my prize paid out?',                     a: 'Winners are notified by email, upload proof of their scores, and our team verifies within 48 hours. Payment lands in your registered account.' },
              { q: 'Can I switch between monthly and annual?',      a: 'Yes. You can upgrade from monthly to annual at any time from your Subscription page. The remaining monthly credit is applied automatically.' },
            ].map((f, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">{f.q}</div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <p className="footer-copy">© 2026 GolfCharity Platform Ltd. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}