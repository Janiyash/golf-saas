'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const handleReset = async () => {
    setErrorMsg(''); setSuccessMsg('')
    if (!email) { setErrorMsg('Please enter your email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    setSuccessMsg('Reset link sent! Please check your inbox.')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--gold-dim:#8B6914;--green:#1A4A2E;--green-mid:#2D6A44;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--text-muted:#7A8A79;}
        html{cursor:none;}
        body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);overflow-x:hidden;}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;opacity:0;transition:opacity .6s ease;}
        .page.loaded{opacity:1;}
        .form-panel{background:var(--dark);display:flex;align-items:center;justify-content:center;padding:48px 64px;position:relative;overflow:hidden;}
        .deco-panel{position:relative;overflow:hidden;background:var(--dark2);display:flex;flex-direction:column;justify-content:space-between;padding:48px;border-left:1px solid rgba(201,168,76,.1);}
        .deco-bg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 70% 40%,rgba(29,74,46,.4) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 20% 80%,rgba(201,168,76,.07) 0%,transparent 60%);}
        .deco-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(201,168,76,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.03) 1px,transparent 1px);background-size:50px 50px;mask-image:radial-gradient(ellipse at 60% 40%,black 20%,transparent 75%);}
        .deco-orb{position:absolute;border-radius:50%;filter:blur(60px);animation:orbFloat 9s ease-in-out infinite;}
        .orb-a{width:400px;height:400px;background:radial-gradient(circle,rgba(29,74,46,.45),transparent);top:-100px;left:-80px;}
        .orb-b{width:220px;height:220px;background:radial-gradient(circle,rgba(201,168,76,.1),transparent);bottom:60px;right:40px;animation-delay:-5s;}
        @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(25px,-18px) scale(1.04)}66%{transform:translate(-18px,12px) scale(.96)}}
        .deco-logo{position:relative;z-index:2;display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;cursor:pointer;color:var(--cream);}
        .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--gold),var(--gold-dim));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;}
        .logo-gold{color:var(--gold);}
        .deco-body{position:relative;z-index:2;}
        .deco-eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(201,168,76,.25);padding:5px 14px;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:28px;}
        .eyebrow-dot{width:5px;height:5px;background:var(--green-bright);border-radius:50%;animation:pulse 2s infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .deco-title{font-family:'Playfair Display',serif;font-size:clamp(2.2rem,3.5vw,3.2rem);font-weight:900;line-height:1.08;margin-bottom:20px;}
        .deco-title .outline{color:transparent;-webkit-text-stroke:1.5px var(--gold);}
        .deco-title .bright{color:var(--green-bright);}
        .deco-desc{font-size:.95rem;color:var(--text-muted);line-height:1.75;font-weight:300;max-width:380px;margin-bottom:40px;}
        .steps-list{display:flex;flex-direction:column;gap:16px;}
        .step-row{display:flex;align-items:flex-start;gap:16px;padding:16px 20px;border:1px solid rgba(201,168,76,.08);background:rgba(8,12,7,.4);}
        .step-num{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;color:rgba(201,168,76,.2);line-height:1;flex-shrink:0;width:28px;}
        .step-txt h5{font-size:.88rem;font-weight:500;color:var(--cream);margin-bottom:3px;}
        .step-txt p{font-size:.78rem;color:var(--text-muted);}
        .deco-footer{position:relative;z-index:2;font-size:.75rem;color:rgba(122,138,121,.45);}
        .form-wrap{width:100%;max-width:400px;position:relative;z-index:2;}
        .form-header{margin-bottom:40px;}
        .form-step{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
        .form-step::before{content:'';width:20px;height:1px;background:var(--gold);opacity:.5;}
        .form-title{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;line-height:1.1;margin-bottom:8px;}
        .form-subtitle{font-size:.88rem;color:var(--text-muted);font-weight:300;}
        .divider{height:1px;background:rgba(201,168,76,.1);margin:28px 0;}
        .field{margin-bottom:20px;}
        .field-label{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;display:block;}
        .field-input{width:100%;background:var(--dark2);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.95rem;padding:14px 16px;outline:none;transition:border-color .25s,box-shadow .25s;}
        .field-input::placeholder{color:rgba(122,138,121,.5);}
        .field-input:focus{border-color:rgba(201,168,76,.5);box-shadow:0 0 0 3px rgba(201,168,76,.06);}
        .msg{padding:12px 16px;font-size:.82rem;margin-bottom:20px;display:flex;align-items:center;gap:10px;}
        .msg-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#FCA5A5;}
        .msg-success{background:rgba(61,186,110,.08);border:1px solid rgba(61,186,110,.2);color:#6EE7A0;}
        .msg-icon{font-size:14px;flex-shrink:0;}
        .btn-submit{width:100%;padding:15px;background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:none;position:relative;overflow:hidden;transition:transform .2s,box-shadow .3s;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));}
        .btn-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 16px 50px rgba(201,168,76,.3);}
        .btn-submit:disabled{opacity:.7;}
        .spinner{width:18px;height:18px;border:2px solid rgba(8,12,7,.3);border-top-color:var(--dark);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .back-btn{background:none;border:1px solid rgba(201,168,76,.2);color:var(--text-muted);font-family:'DM Sans',sans-serif;font-size:.82rem;padding:10px 18px;cursor:none;transition:all .2s;width:100%;margin-bottom:14px;}
        .back-btn:hover{border-color:rgba(201,168,76,.4);color:var(--cream);}
        .switch-row{text-align:center;margin-top:28px;font-size:.85rem;color:var(--text-muted);}
        .switch-link{color:var(--gold);background:none;border:none;cursor:none;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;transition:color .2s;text-decoration:underline;text-underline-offset:3px;}
        .switch-link:hover{color:var(--gold-light);}
        .back-to-home{position:fixed;top:32px;left:32px;z-index:50;display:flex;align-items:center;gap:8px;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:rgba(201,168,76,.5);cursor:none;transition:color .2s;background:none;border:none;}
        .back-to-home:hover{color:var(--gold);}
        .back-arrow{font-size:12px;transition:transform .2s;}
        .back-to-home:hover .back-arrow{transform:translateX(-3px);}
        @media(max-width:900px){.page{grid-template-columns:1fr;}.deco-panel{display:none;}.form-panel{padding:40px 28px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <button className="back-to-home" onClick={() => router.push('/')}>
        <span className="back-arrow">←</span> Back to home
      </button>
      <div className={`page${isLoaded ? ' loaded' : ''}`}>
        <div className="form-panel">
          <div className="form-wrap">
            <div className="form-header">
              <div className="form-step">Password Recovery</div>
              <h1 className="form-title">Reset your<br />password</h1>
              <p className="form-subtitle">Enter your email and we'll send a secure reset link.</p>
            </div>
            {errorMsg && <div className="msg msg-error"><span className="msg-icon">⚠</span>{errorMsg}</div>}
            {successMsg && <div className="msg msg-success"><span className="msg-icon">✓</span>{successMsg}</div>}
            <div className="field">
              <label className="field-label">Email Address</label>
              <input className="field-input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>
            <div className="divider" />
            <button className="btn-submit" onClick={handleReset} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Send Reset Link →'}
            </button>
            <button className="back-btn" onClick={() => router.push('/login')}>← Back to Login</button>
            <div className="switch-row">
              Don't have an account?{' '}
              <button className="switch-link" onClick={() => router.push('/signup')}>Create one free</button>
            </div>
          </div>
        </div>
        <div className="deco-panel">
          <div className="deco-bg" /><div className="deco-grid" />
          <div className="deco-orb orb-a" /><div className="deco-orb orb-b" />
          <div className="deco-logo" onClick={() => router.push('/')}>
            <div className="logo-icon">⛳</div>Golf<span className="logo-gold">Charity</span>
          </div>
          <div className="deco-body">
            <div className="deco-eyebrow"><span className="eyebrow-dot" />Account Recovery</div>
            <h2 className="deco-title">Back on the<br /><span className="outline">fairway</span><br /><span className="bright">in seconds.</span></h2>
            <p className="deco-desc">A secure link will arrive in your inbox. Click it to create a new password and get straight back into your game.</p>
            <div className="steps-list">
              {[
                { n: '01', t: 'Enter Email', d: 'Type the address linked to your account.' },
                { n: '02', t: 'Check Inbox', d: 'We\'ll send a secure reset link within 60 seconds.' },
                { n: '03', t: 'Set New Password', d: 'Click the link and choose a strong new password.' },
              ].map(s => (
                <div key={s.n} className="step-row">
                  <div className="step-num">{s.n}</div>
                  <div className="step-txt"><h5>{s.t}</h5><p>{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="deco-footer">© 2026 GolfCharity Platform Ltd.</div>
        </div>
      </div>
    </>
  )
}
