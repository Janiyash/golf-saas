'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { type JSX } from 'react'
export default function Login(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [showPass, setShowPass] = useState<boolean>(false)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [forgotMode, setForgotMode] = useState<boolean>(false)
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

  const handleLogin = async (): Promise<void> => {
    setErrorMsg('')
    setSuccessMsg('')
    if (!email || !password) { setErrorMsg('Please fill all fields'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    setSuccessMsg('Welcome back! Redirecting...')
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  const handleForgot = async (): Promise<void> => {
    setErrorMsg('')
    setSuccessMsg('')

    if (!email) {
      setErrorMsg('Enter your email to reset password')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setSuccessMsg('Reset link sent! Check your inbox.')
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') forgotMode ? handleForgot() : handleLogin()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --gold: #C9A84C; --gold-light: #F0D080; --gold-dim: #8B6914;
          --green: #1A4A2E; --green-mid: #2D6A44; --green-bright: #3DBA6E;
          --cream: #FAF6EE; --dark: #080C07; --dark2: #0E1510; --text-muted: #7A8A79;
        }
        html { cursor: none; }
        body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--cream); overflow-x: hidden; }

        .cursor-ring {
          position: fixed; width: 40px; height: 40px;
          border: 1.5px solid var(--gold); border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transition: transform 0.12s ease; mix-blend-mode: difference;
        }
        .cursor-dot {
          position: fixed; width: 8px; height: 8px;
          background: var(--gold); border-radius: 50%;
          pointer-events: none; z-index: 10000;
          transition: transform 0.05s linear;
        }
        .noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .page {
          min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
          opacity: 0; transition: opacity 0.6s ease;
        }
        .page.loaded { opacity: 1; }

        /* RIGHT becomes LEFT on login — reversed layout */
        .form-panel {
          background: var(--dark);
          display: flex; align-items: center; justify-content: center;
          padding: 48px 64px; position: relative; overflow: hidden;
          order: 1;
        }
        .form-panel::before {
          content: ''; position: absolute;
          top: -200px; left: -200px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(29,74,46,0.06), transparent);
          pointer-events: none;
        }

        .deco-panel {
          position: relative; overflow: hidden;
          background: var(--dark2); order: 2;
          display: flex; flex-direction: column;
          justify-content: space-between; padding: 48px;
          border-left: 1px solid rgba(201,168,76,0.1);
        }
        .deco-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 70% 40%, rgba(29,74,46,0.4) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(201,168,76,0.07) 0%, transparent 60%);
        }
        .deco-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at 60% 40%, black 20%, transparent 75%);
        }
        .deco-orb {
          position: absolute; border-radius: 50%; filter: blur(60px);
          animation: orbFloat 9s ease-in-out infinite;
        }
        .orb-a { width: 400px; height: 400px; background: radial-gradient(circle, rgba(29,74,46,0.45), transparent); top: -100px; left: -80px; }
        .orb-b { width: 220px; height: 220px; background: radial-gradient(circle, rgba(201,168,76,0.1), transparent); bottom: 60px; right: 40px; animation-delay: -5s; }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(25px,-18px) scale(1.04); }
          66% { transform: translate(-18px,12px) scale(0.96); }
        }

        .deco-logo {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700;
          cursor: none; color: var(--cream);
        }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--gold), var(--gold-dim)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .logo-gold { color: var(--gold); }

        .deco-body { position: relative; z-index: 2; }
        .deco-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(201,168,76,0.25); padding: 5px 14px;
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 28px;
        }
        .eyebrow-dot { width: 5px; height: 5px; background: var(--green-bright); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        .deco-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 3.5vw, 3.2rem); font-weight: 900; line-height: 1.08; margin-bottom: 20px;
        }
        .deco-title .outline { color: transparent; -webkit-text-stroke: 1.5px var(--gold); }
        .deco-title .bright { color: var(--green-bright); }
        .deco-desc { font-size: 0.95rem; color: var(--text-muted); line-height: 1.75; font-weight: 300; max-width: 380px; margin-bottom: 40px; }

        /* SCORE CARD DISPLAY */
        .score-card {
          background: rgba(8,12,7,0.6); border: 1px solid rgba(201,168,76,0.15);
          backdrop-filter: blur(20px); padding: 28px 32px; margin-bottom: 20px;
          position: relative; overflow: hidden;
        }
        .score-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .sc-label { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
        .sc-scores { display: flex; gap: 12px; align-items: flex-end; }
        .sc-score {
          font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900;
          color: var(--cream); padding: 8px 12px;
          background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.1);
          line-height: 1;
        }
        .sc-score.best { color: var(--green-bright); border-color: rgba(61,186,110,0.2); background: rgba(61,186,110,0.05); }
        .sc-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 12px; }

        .prize-tag {
          background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06));
          border: 1px solid rgba(201,168,76,0.2);
          padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
        }
        .prize-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }
        .prize-val {
          font-family: 'Playfair Display', serif; font-size: 1.5rem;
          font-weight: 900; color: var(--gold);
        }

        .deco-footer { position: relative; z-index: 2; font-size: 0.75rem; color: rgba(122,138,121,0.45); }

        /* FORM */
        .form-wrap { width: 100%; max-width: 400px; position: relative; z-index: 2; }
        .form-header { margin-bottom: 40px; }
        .form-step {
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .form-step::before { content: ''; width: 20px; height: 1px; background: var(--gold); opacity: 0.5; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; line-height: 1.1; margin-bottom: 8px; }
        .form-subtitle { font-size: 0.88rem; color: var(--text-muted); font-weight: 300; }

        .divider { height: 1px; background: rgba(201,168,76,0.1); margin: 28px 0; }

        .field { margin-bottom: 20px; }
        .field-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; display: block; }
        .field-wrap { position: relative; }
        .field-input {
          width: 100%; background: var(--dark2);
          border: 1px solid rgba(201,168,76,0.1);
          color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          padding: 14px 16px; outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .field-input::placeholder { color: rgba(122,138,121,0.5); }
        .field-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.06); }
        .field-input.has-icon { padding-right: 48px; }
        .eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted); cursor: none; font-size: 16px; transition: color 0.2s; padding: 4px;
        }
        .eye-btn:hover { color: var(--gold); }

        .forgot-row {
          display: flex; justify-content: flex-end; margin-top: -12px; margin-bottom: 20px;
        }
        .forgot-btn {
          background: none; border: none; cursor: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
          color: var(--gold-dim); transition: color 0.2s;
          text-decoration: underline; text-underline-offset: 3px;
        }
        .forgot-btn:hover { color: var(--gold); }

        .msg { padding: 12px 16px; font-size: 0.82rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .msg-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #FCA5A5; }
        .msg-success { background: rgba(61,186,110,0.08); border: 1px solid rgba(61,186,110,0.2); color: #6EE7A0; }
        .msg-icon { font-size: 14px; flex-shrink: 0; }

        .btn-submit {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, var(--gold), #E8C060);
          color: var(--dark); border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: none; position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.3s;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
        }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: white; opacity: 0; transition: opacity 0.3s; }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(201,168,76,0.3); }
        .btn-submit:not(:disabled):hover::after { opacity: 0.08; }
        .btn-submit:disabled { opacity: 0.7; }

        .spinner { width: 18px; height: 18px; border: 2px solid rgba(8,12,7,0.3); border-top-color: var(--dark); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .back-btn {
          background: none; border: 1px solid rgba(201,168,76,0.2); color: var(--text-muted);
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem; padding: 10px 18px;
          cursor: none; transition: all 0.2s; width: 100%; margin-bottom: 14px;
        }
        .back-btn:hover { border-color: rgba(201,168,76,0.4); color: var(--cream); }

        .switch-row { text-align: center; margin-top: 28px; font-size: 0.85rem; color: var(--text-muted); }
        .switch-link {
          color: var(--gold); background: none; border: none;
          cursor: none; font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          font-weight: 500; transition: color 0.2s; text-decoration: underline; text-underline-offset: 3px;
        }
        .switch-link:hover { color: var(--gold-light); }

        /* ANIMATED BACK LINK */
        .back-to-home {
          position: fixed; top: 32px; left: 32px; z-index: 50;
          display: flex; align-items: center; gap: 8px;
          font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(201,168,76,0.5); cursor: none; transition: color 0.2s;
          background: none; border: none;
        }
        .back-to-home:hover { color: var(--gold); }
        .back-arrow { font-size: 12px; transition: transform 0.2s; }
        .back-to-home:hover .back-arrow { transform: translateX(-3px); }

        @media (max-width: 900px) {
          .page { grid-template-columns: 1fr; }
          .deco-panel { display: none; }
          .form-panel { padding: 40px 28px; }
        }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />

      <button className="back-to-home" onClick={() => router.push('/')}>
        <span className="back-arrow">←</span> Back to home
      </button>

      <div className={`page ${isLoaded ? 'loaded' : ''}`}>

        {/* FORM PANEL (left on login) */}
        <div className="form-panel">
          <div className="form-wrap">

            <div className="form-header">
              <div className="form-step">
                {forgotMode ? 'Password Recovery' : 'Member Access'}
              </div>
              <h1 className="form-title">
                {forgotMode ? 'Reset your\npassword' : 'Welcome\nback'}
              </h1>
              <p className="form-subtitle">
                {forgotMode
                  ? "We'll send a recovery link to your email."
                  : 'Sign in to your GolfCharity account.'}
              </p>
            </div>

            {errorMsg && (
              <div className="msg msg-error"><span className="msg-icon">⚠</span> {errorMsg}</div>
            )}
            {successMsg && (
              <div className="msg msg-success"><span className="msg-icon">✓</span> {successMsg}</div>
            )}

            <div className="field">
              <label className="field-label">Email Address</label>
              <div className="field-wrap">
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {!forgotMode && (
              <>
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="field-wrap">
                    <input
                      className="field-input has-icon"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="forgot-row">
                  <button className="forgot-btn" onClick={() => { setForgotMode(true); setErrorMsg(''); setSuccessMsg('') }}>
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            <div className="divider" />

            {forgotMode && (
              <button className="back-btn" onClick={() => { setForgotMode(false); setErrorMsg(''); setSuccessMsg('') }}>
                ← Back to Login
              </button>
            )}

            <button
              className="btn-submit"
              onClick={forgotMode ? handleForgot : handleLogin}
              disabled={loading}
            >
              {loading
                ? <div className="spinner" />
                : forgotMode ? 'Send Reset Link →' : 'Sign In →'}
            </button>

            <div className="switch-row">
              {forgotMode ? 'Remembered it? ' : "Don't have an account? "}
              <button
                className="switch-link"
                onClick={() => forgotMode ? setForgotMode(false) : router.push('/signup')}
              >
                {forgotMode ? 'Sign in' : 'Create one free'}
              </button>
            </div>

          </div>
        </div>

        {/* DECO PANEL (right on login) */}
        <div className="deco-panel">
          <div className="deco-bg" />
          <div className="deco-grid" />
          <div className="deco-orb orb-a" />
          <div className="deco-orb orb-b" />

          <div className="deco-logo" onClick={() => router.push('/')}>
            <div className="logo-icon">⛳</div>
            Golf<span className="logo-gold">Charity</span>
          </div>

          <div className="deco-body">
            <div className="deco-eyebrow">
              <span className="eyebrow-dot" />
              Season 2026 — Live
            </div>
            <h2 className="deco-title">
              Your scores.<br />
              <span className="outline">Your prizes.</span><br />
              <span className="bright">Your impact.</span>
            </h2>
            <p className="deco-desc">
              Every login brings you closer to a prize draw win and a
              larger contribution to the cause you care most about.
            </p>

            <div className="score-card">
              <div className="sc-label">Your Last 5 Scores — Stableford</div>
              <div className="sc-scores">
                {[34, 38, 29, 41, 36].map((s, i) => (
                  <div key={i} className={`sc-score ${s === 41 ? 'best' : ''}`}>{s}</div>
                ))}
              </div>
              <div className="sc-meta">Best: 41 pts · Avg: 35.6 pts · Trend: ↑ improving</div>
            </div>

            <div className="prize-tag">
              <div>
                <div className="prize-label">Next Draw</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--cream)', marginTop: 2 }}>April 30, 2026</div>
              </div>
              <div>
                <div className="prize-label">Prize Pool</div>
                <div className="prize-val">£5,000</div>
              </div>
            </div>
          </div>

          <div className="deco-footer">© 2026 GolfCharity Platform Ltd.</div>
        </div>

      </div>
    </>
  )
}