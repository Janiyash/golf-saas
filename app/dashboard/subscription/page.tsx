'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { formatDate, formatMonthYear } from '@/utils/helpers'

export default function Subscription() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [isLoaded,        setIsLoaded]        = useState(false)
  const [sub,             setSub]             = useState<any>(null)
  const [subLoading,      setSubLoading]      = useState(true)
  const [userName,        setUserName]        = useState('Member')
  const [userId,          setUserId]          = useState<string>('')
  const [userEmail,       setUserEmail]       = useState<string>('')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [toast,           setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [polling,         setPolling]         = useState(false)

  const cursorRef    = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  // ── Handle Stripe redirect back ────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ msg: '🎉 Payment successful! Activating your subscription...', type: 'success' })
      setPolling(true)
    }
    if (searchParams.get('cancelled') === 'true') {
      setToast({ msg: 'Payment cancelled. You can try again anytime.', type: 'error' })
    }
  }, [searchParams])

  // ── Poll DB after payment until webhook writes the subscription ────────────
  // Stripe webhooks can take 5–15s. We poll every 2s for up to 20s so the
  // page shows the subscription the moment it appears in the DB.
  useEffect(() => {
    if (!polling || !userId) return

    let attempts = 0
    const MAX = 10 // 10 × 2s = 20s max wait

    const interval = setInterval(async () => {
      attempts++
      // ✅ Only select columns that exist in schema: id, user_id, plan, status, start_date, end_date
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan, status, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subData) {
        setSub(subData)
        setSubLoading(false)
        setPolling(false)
        clearInterval(interval)
        window.history.replaceState({}, '', '/dashboard/subscription')
        setToast({ msg: '✅ Subscription is now active!', type: 'success' })
      } else if (attempts >= MAX) {
        setPolling(false)
        clearInterval(interval)
        setToast({
          msg: 'Subscription may take a moment to appear. Please refresh in 30 seconds if it does not show.',
          type: 'error',
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [polling, userId])

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoaded(true)
    const h = (e: MouseEvent) => {
      if (cursorRef.current)    cursorRef.current.style.transform    = `translate(${e.clientX - 20}px,${e.clientY - 20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 4}px)`
    }
    window.addEventListener('mousemove', h)

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserEmail(user.email ?? '')

      // ✅ Schema: users(id, name, email, role, subscription_status, charity_id, charity_percentage)
      const { data: appUser } = await supabase
        .from('users')
        .select('id, name, subscription_status')
        .eq('email', user.email)
        .single()

      if (appUser) {
        setUserId(appUser.id)
        setUserName(appUser.name || user.email?.split('@')[0] || 'Member')
      }

      // ✅ Schema: subscriptions(id, user_id, plan, status, start_date, end_date)
      //    No stripe_sub_id, stripe_customer_id or updated_at columns
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan, status, start_date, end_date')
        .eq('user_id', appUser?.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      setSub(subData)
      setSubLoading(false)
    }

    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // ── Checkout — uses appUser.id (custom users table UUID) ──────────────────
  const handleCheckout = async (type: 'monthly' | 'yearly') => {
    if (!userId) {
      setToast({ msg: 'Session expired. Please log in again.', type: 'error' })
      return
    }
    setCheckoutLoading(type)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: type, userId, userEmail }),
      })

      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch {
        throw new Error('Server error — check API route logs.')
      }

      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url

    } catch (err: any) {
      setToast({ msg: err.message || 'Something went wrong.', type: 'error' })
      setCheckoutLoading(null)
    }
  }

  // ── Cancel — marks cancelled in DB via cancel API route ───────────────────
  // NOTE: no stripe_sub_id in schema, so cancel route uses userId to find sub
  const handleCancel = async () => {
    if (!userId) return
    if (!confirm('Are you sure you want to cancel? Access continues until the end of your billing period.')) return

    const res  = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (data.error) {
      setToast({ msg: data.error, type: 'error' })
    } else {
      setToast({ msg: 'Subscription cancelled. Access continues until period end.', type: 'success' })
      setSub(null)
    }
  }

  const planLabel = sub?.plan === 'yearly' ? 'Pro Yearly' : 'Pro Monthly'
  const price     = sub?.plan === 'yearly' ? '£47.88' : '£4.99'
  const period    = sub?.plan === 'yearly' ? 'year' : 'month'

  const features = [
    'Full score tracking (5-score rolling window)',
    'Monthly prize draw entry',
    'Charity contribution (min 10%)',
    'Performance analytics dashboard',
    'Winner verification & payout',
    'Unlimited score history export',
  ]

  const plansData = [
    { id: 'monthly', label: 'Pro Monthly', price: '£4.99',  period: 'month', tag: null,                         desc: 'Pay month-to-month. Cancel anytime.' },
    { id: 'yearly',  label: 'Pro Yearly',  price: '£47.88', period: 'year',  tag: 'Best Value — 2 Months Free', desc: 'Save £11.99 vs monthly. All features included.' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --gold:#C9A84C; --gold-light:#F0D080; --gold-dim:#8B6914;
          --green:#1A4A2E; --green-mid:#2D6A44; --green-bright:#3DBA6E;
          --cream:#FAF6EE; --dark:#080C07; --dark2:#0E1510; --dark3:#111A12;
          --text-muted:#7A8A79; --border:rgba(201,168,76,.1); --sidebar-w:260px;
        }
        html { cursor: none; }
        body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--cream); overflow-x: hidden; }
        .cursor-ring { position:fixed; width:40px; height:40px; border:1.5px solid var(--gold); border-radius:50%; pointer-events:none; z-index:9999; transition:transform .12s ease; mix-blend-mode:difference; }
        .cursor-dot  { position:fixed; width:8px; height:8px; background:var(--gold); border-radius:50%; pointer-events:none; z-index:10000; transition:transform .05s linear; }
        .noise { position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.025; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .dash-wrap { display:flex; min-height:100vh; opacity:0; transition:opacity .6s; }
        .dash-wrap.loaded { opacity:1; }
        .main { flex:1; margin-left:var(--sidebar-w); min-height:100vh; display:flex; flex-direction:column; margin-top:64px; }
        .topbar { height:64px; border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 32px; background:rgba(8,12,7,.6); backdrop-filter:blur(20px); position:sticky; top:0; z-index:40; }
        .topbar-title { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--cream); }
        .content { flex:1; padding:32px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes polling { to { left:100%; } }

        /* TOAST */
        .toast { position:fixed; top:80px; right:32px; z-index:9000; padding:14px 20px; font-size:.85rem; display:flex; align-items:center; gap:10px; animation:slideDown .25s ease; max-width:440px; box-shadow:0 8px 40px rgba(0,0,0,.5); }
        .toast.success { background:rgba(29,74,46,.97); border:1px solid rgba(61,186,110,.3); color:#6EE7A0; }
        .toast.error   { background:rgba(60,10,10,.97);  border:1px solid rgba(239,68,68,.3);  color:#FCA5A5; }
        .toast-close { margin-left:auto; background:none; border:none; color:inherit; cursor:pointer; font-size:16px; opacity:.7; padding:0 0 0 8px; }
        .toast-close:hover { opacity:1; }

        /* POLLING BAR */
        .polling-bar { height:2px; background:rgba(201,168,76,.12); position:relative; overflow:hidden; margin-bottom:20px; border-radius:2px; }
        .polling-bar-fill { position:absolute; top:0; left:-40%; width:40%; height:100%; background:linear-gradient(90deg,transparent,var(--gold),transparent); animation:polling 1.4s linear infinite; }

        /* ACTIVE PLAN CARD */
        .plan-card { background:var(--dark2); border:1px solid var(--border); padding:32px; margin-bottom:20px; position:relative; }
        .plan-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
        .plan-badge { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(201,168,76,.3); padding:4px 12px; font-size:.7rem; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); margin-bottom:20px; }
        .plan-dot { width:5px; height:5px; background:var(--green-bright); border-radius:50%; animation:pulse 2s infinite; }
        .plan-name { font-family:'Playfair Display',serif; font-size:1.8rem; font-weight:900; margin-bottom:4px; }
        .plan-price { font-size:.9rem; color:var(--text-muted); margin-bottom:20px; }
        .plan-price span { font-family:'Playfair Display',serif; font-size:1.6rem; font-weight:900; color:var(--gold); }
        .plan-feats { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
        .plan-feat { display:flex; align-items:center; gap:12px; font-size:.85rem; }
        .feat-dot { width:5px; height:5px; background:var(--green-bright); border-radius:50%; flex-shrink:0; }
        .plan-actions { display:flex; gap:12px; flex-wrap:wrap; }
        .btn-outline { background:none; border:1px solid rgba(201,168,76,.3); color:var(--gold); padding:10px 20px; font-family:'DM Sans',sans-serif; font-size:.8rem; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; }
        .btn-outline:hover:not(:disabled) { background:rgba(201,168,76,.05); border-color:rgba(201,168,76,.5); }
        .btn-outline:disabled { opacity:.6; cursor:not-allowed; }
        .btn-danger { background:none; border:1px solid rgba(239,68,68,.3); color:#FCA5A5; padding:10px 20px; font-family:'DM Sans',sans-serif; font-size:.8rem; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; }
        .btn-danger:hover { background:rgba(239,68,68,.05); }
        .renewal-info { background:rgba(29,74,46,.1); border:1px solid rgba(61,186,110,.15); padding:20px 24px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px; }
        .renewal-label { font-size:.7rem; letter-spacing:.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px; }
        .renewal-date { font-size:.95rem; font-weight:500; color:var(--cream); }
        .upsell-card { background:linear-gradient(135deg,rgba(29,74,46,.2),rgba(29,74,46,.05)); border:1px solid rgba(61,186,110,.2); padding:32px; }
        .section-eyebrow { font-size:.65rem; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); margin-bottom:6px; }
        .section-title { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--cream); }
        .btn-primary { background:linear-gradient(135deg,var(--gold),#E8C060); color:var(--dark); border:none; padding:12px 28px; font-family:'DM Sans',sans-serif; font-size:.85rem; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:transform .2s,box-shadow .3s; display:inline-flex; align-items:center; gap:8px; }
        .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 30px rgba(201,168,76,.25); }
        .btn-primary:disabled { opacity:.6; cursor:not-allowed; }

        /* NO SUB STATE */
        .no-sub-banner { background:var(--dark2); border:1px solid rgba(201,168,76,.12); padding:40px 36px; margin-bottom:28px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:24px; }
        .no-sub-banner::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(239,68,68,.6),transparent); }
        .no-sub-banner::after { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 10% 50%,rgba(239,68,68,.04),transparent); pointer-events:none; }
        .no-sub-left { position:relative; z-index:1; }
        .no-sub-badge { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(239,68,68,.3); padding:4px 12px; font-size:.68rem; letter-spacing:.12em; text-transform:uppercase; color:#FCA5A5; margin-bottom:14px; }
        .no-sub-dot { width:5px; height:5px; background:#EF4444; border-radius:50%; animation:pulse 2s infinite; }
        .no-sub-title { font-family:'Playfair Display',serif; font-size:1.6rem; font-weight:900; margin-bottom:8px; color:var(--cream); }
        .no-sub-desc { font-size:.88rem; color:var(--text-muted); font-weight:300; line-height:1.6; max-width:400px; }
        .no-sub-right { position:relative; z-index:1; }
        .plans-heading { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700; margin-bottom:6px; }
        .plans-sub { font-size:.85rem; color:var(--text-muted); font-weight:300; margin-bottom:24px; }
        .plans-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px; }
        .plan-option { background:var(--dark2); border:1px solid var(--border); padding:28px; position:relative; transition:border-color .25s,transform .2s; }
        .plan-option:hover { border-color:rgba(201,168,76,.3); transform:translateY(-2px); }
        .plan-option.featured { border-color:rgba(61,186,110,.25); background:linear-gradient(135deg,rgba(29,74,46,.15),var(--dark2)); }
        .plan-option.featured::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--green-bright),transparent); }
        .plan-option-tag { display:inline-flex; align-items:center; gap:6px; background:rgba(61,186,110,.12); border:1px solid rgba(61,186,110,.2); padding:3px 10px; font-size:.65rem; letter-spacing:.1em; text-transform:uppercase; color:var(--green-bright); margin-bottom:14px; }
        .plan-option-name { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; margin-bottom:4px; }
        .plan-option-price { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:var(--gold); line-height:1; margin-bottom:4px; }
        .plan-option-period { font-size:.78rem; color:var(--text-muted); margin-bottom:14px; }
        .plan-option-desc { font-size:.82rem; color:var(--text-muted); line-height:1.6; margin-bottom:20px; font-weight:300; }
        .plan-option-feats { display:flex; flex-direction:column; gap:8px; margin-bottom:24px; }
        .plan-option-feat { display:flex; align-items:center; gap:10px; font-size:.8rem; color:var(--cream); }
        .plan-option-feat-dot { width:4px; height:4px; background:var(--green-bright); border-radius:50%; flex-shrink:0; }
        .btn-subscribe { width:100%; padding:13px; background:linear-gradient(135deg,var(--gold),#E8C060); color:var(--dark); border:none; font-family:'DM Sans',sans-serif; font-size:.82rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:transform .2s,box-shadow .3s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-subscribe:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 10px 35px rgba(201,168,76,.3); }
        .btn-subscribe:disabled { opacity:.6; cursor:not-allowed; }
        .btn-subscribe-outline { width:100%; padding:13px; background:none; border:1px solid rgba(201,168,76,.3); color:var(--gold); font-family:'DM Sans',sans-serif; font-size:.82rem; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-subscribe-outline:hover:not(:disabled) { background:rgba(201,168,76,.06); border-color:rgba(201,168,76,.5); }
        .btn-subscribe-outline:disabled { opacity:.6; cursor:not-allowed; }
        .spinner { width:15px; height:15px; border:2px solid rgba(8,12,7,.3); border-top-color:var(--dark); border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        .spinner-gold { border-color:rgba(201,168,76,.2); border-top-color:var(--gold); }
        .perks-row { background:rgba(29,74,46,.08); border:1px solid rgba(61,186,110,.1); padding:20px 24px; display:flex; gap:32px; flex-wrap:wrap; }
        .perk { display:flex; align-items:center; gap:10px; font-size:.82rem; color:var(--text-muted); }
        .perk-icon { font-size:16px; }
        @media(max-width:768px){
          .main{margin-left:0;} .content{padding:20px 16px;}
          .renewal-info,.plan-actions{flex-direction:column;}
          .plans-grid{grid-template-columns:1fr;} .no-sub-banner{flex-direction:column;}
          .toast{right:16px;left:16px;max-width:none;}
        }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <NavBar />

      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} plan={sub ? planLabel : 'No Plan'} />

        <main className="main">
          <div className="topbar">
            <span className="topbar-title">Subscription</span>
          </div>

          <div className="content">

            {/* Polling progress bar — animates while waiting for webhook */}
            {polling && (
              <div className="polling-bar">
                <div className="polling-bar-fill" />
              </div>
            )}

            {/* LOADING */}
            {subLoading && !polling && (
              <div style={{ color: 'var(--text-muted)', fontSize: '.9rem', padding: '40px 0', textAlign: 'center' }}>
                Loading subscription details...
              </div>
            )}

            {/* NO SUBSCRIPTION */}
            {!subLoading && !sub && !polling && (
              <>
                <div className="no-sub-banner">
                  <div className="no-sub-left">
                    <div className="no-sub-badge"><span className="no-sub-dot" /> No Active Subscription</div>
                    <div className="no-sub-title">You're not subscribed yet.</div>
                    <p className="no-sub-desc">Subscribe to start tracking scores, entering monthly prize draws, and contributing to your chosen charity.</p>
                  </div>
                  <div className="no-sub-right">
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 6, textAlign: 'right' }}>Starting from</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.4rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>£4.99</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 4 }}>per month</div>
                  </div>
                </div>

                <div className="plans-heading">Choose Your Plan</div>
                <p className="plans-sub">Both plans include every feature. Pick what works for you.</p>

                <div className="plans-grid">
                  {plansData.map((plan) => (
                    <div key={plan.id} className={`plan-option ${plan.id === 'yearly' ? 'featured' : ''}`}>
                      {plan.tag && <div className="plan-option-tag">⭐ {plan.tag}</div>}
                      <div className="plan-option-name">{plan.label}</div>
                      <div className="plan-option-price">{plan.price}</div>
                      <div className="plan-option-period">per {plan.period}</div>
                      <div className="plan-option-desc">{plan.desc}</div>
                      <div className="plan-option-feats">
                        {features.map((f, i) => (
                          <div key={i} className="plan-option-feat"><span className="plan-option-feat-dot" />{f}</div>
                        ))}
                      </div>
                      {plan.id === 'yearly' ? (
                        <button className="btn-subscribe" disabled={!!checkoutLoading} onClick={() => handleCheckout('yearly')}>
                          {checkoutLoading === 'yearly' ? <><div className="spinner" />Redirecting...</> : `Subscribe — ${plan.price} →`}
                        </button>
                      ) : (
                        <button className="btn-subscribe-outline" disabled={!!checkoutLoading} onClick={() => handleCheckout('monthly')}>
                          {checkoutLoading === 'monthly' ? <><div className="spinner spinner-gold" />Redirecting...</> : `Subscribe — ${plan.price} →`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="perks-row">
                  {[
                    { icon: '🔒', text: 'Secure payment via Stripe' },
                    { icon: '❌', text: 'Cancel anytime, no lock-in' },
                    { icon: '🎁', text: 'First month free on signup' },
                    { icon: '💚', text: 'Charity contribution included' },
                  ].map((p, i) => (
                    <div key={i} className="perk"><span className="perk-icon">{p.icon}</span> {p.text}</div>
                  ))}
                </div>
              </>
            )}

            {/* ACTIVE SUBSCRIPTION */}
            {!subLoading && sub && (
              <>
                <div className="plan-card">
                  <div className="plan-badge"><span className="plan-dot" />Active Subscription</div>
                  <div className="plan-name">{planLabel}</div>
                  <div className="plan-price"><span>{price}</span> / {period}</div>
                  <div className="plan-feats">
                    {features.map((f, i) => (
                      <div key={i} className="plan-feat"><span className="feat-dot" />{f}</div>
                    ))}
                  </div>
                  <div className="plan-actions">
                    {sub.plan !== 'yearly' && (
                      <button className="btn-outline" disabled={!!checkoutLoading} onClick={() => handleCheckout('yearly')}>
                        {checkoutLoading === 'yearly' ? 'Redirecting...' : 'Upgrade to Yearly — Save 20%'}
                      </button>
                    )}
                    <button className="btn-danger" onClick={handleCancel}>Cancel Subscription</button>
                  </div>
                </div>

                <div className="renewal-info">
                  {/* ✅ Uses only schema columns: start_date, end_date */}
                  <div><div className="renewal-label">Next Renewal</div><div className="renewal-date">{formatDate(sub?.end_date)}</div></div>
                  <div><div className="renewal-label">Payment Method</div><div className="renewal-date">Card on file</div></div>
                  <div><div className="renewal-label">Member Since</div><div className="renewal-date">{formatMonthYear(sub?.start_date)}</div></div>
                  <div>
                    <div className="renewal-label">Status</div>
                    <div style={{ color: 'var(--green-bright)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, background: 'var(--green-bright)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                      Active
                    </div>
                  </div>
                </div>

                {sub.plan !== 'yearly' && (
                  <div className="upsell-card">
                    <div className="section-eyebrow">Special Offer</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div className="section-title" style={{ marginBottom: 6 }}>Switch to Yearly & Save £12</div>
                        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
                          Pay annually and get 2 months free. All features remain fully active.
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: 'var(--green-bright)', lineHeight: 1 }}>£47.88</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 4 }}>per year · save £11.99</div>
                        <button className="btn-primary" style={{ marginTop: 12 }} disabled={!!checkoutLoading} onClick={() => handleCheckout('yearly')}>
                          {checkoutLoading === 'yearly' ? <><div className="spinner" />Redirecting...</> : 'Upgrade Now →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </>
  )
}