'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { type JSX } from 'react'

export default function Signup(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [showPass, setShowPass] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
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

  const handleSignup = async (): Promise<void> => {
    setErrorMsg('')
    setSuccessMsg('')
    if (!email || !password || !confirmPassword) { setErrorMsg('Please fill all fields'); return }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setErrorMsg(error.message); setLoading(false); return }
    const user = data.user
    if (!user) { setErrorMsg('User not created properly'); setLoading(false); return }
    const { error: dbError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      role: 'user',
      subscription_status: 'inactive',
    })
    if (dbError) { setErrorMsg(dbError.message); setLoading(false); return }
    setSuccessMsg('Account created! Redirecting...')
    setLoading(false)
    setTimeout(() => router.push('/login'), 1500)
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

        /* LEFT PANEL */
        .left-panel {
          position: relative; overflow: hidden;
          background: var(--dark2);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          border-right: 1px solid rgba(201,168,76,0.1);
        }
        .left-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 30% 40%, rgba(29,74,46,0.4) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(201,168,76,0.08) 0%, transparent 60%);
        }
        .left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at 40% 40%, black 20%, transparent 75%);
        }
        .left-orb {
          position: absolute; border-radius: 50%; filter: blur(60px);
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb1 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(29,74,46,0.5), transparent); top: -80px; right: -80px; }
        .orb2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(201,168,76,0.12), transparent); bottom: 80px; left: 0; animation-delay: -4s; }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-15px) scale(1.05); }
          66% { transform: translate(-15px,10px) scale(0.95); }
        }

        .left-logo {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700;
          cursor: none; text-decoration: none; color: var(--cream);
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .logo-gold { color: var(--gold); }

        .left-body { position: relative; z-index: 2; }
        .left-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(201,168,76,0.25); padding: 5px 14px;
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 28px;
        }
        .eyebrow-dot {
          width: 5px; height: 5px; background: var(--green-bright); border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .left-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 3.5vw, 3.2rem);
          font-weight: 900; line-height: 1.08; margin-bottom: 20px;
        }
        .left-title .outline { color: transparent; -webkit-text-stroke: 1.5px var(--gold); }
        .left-title .bright { color: var(--green-bright); }
        .left-desc {
          font-size: 0.95rem; color: var(--text-muted); line-height: 1.75;
          font-weight: 300; max-width: 380px; margin-bottom: 40px;
        }

        /* STATS ROW */
        .stats-row { display: flex; gap: 32px; }
        .stat { }
        .stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem; font-weight: 900; color: var(--gold); line-height: 1;
        }
        .stat-lbl { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-top: 3px; }

        /* FEATURE PILLS */
        .pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
        .pill {
          display: flex; align-items: center; gap: 8px;
          background: rgba(29,74,46,0.2); border: 1px solid rgba(61,186,110,0.15);
          padding: 8px 16px; font-size: 0.8rem; color: var(--cream); font-weight: 300;
        }
        .pill-dot { width: 5px; height: 5px; background: var(--green-bright); border-radius: 50%; }

        .left-footer { position: relative; z-index: 2; }
        .left-footer-text { font-size: 0.75rem; color: rgba(122,138,121,0.45); letter-spacing: 0.04em; }

        /* RIGHT PANEL — FORM */
        .right-panel {
          background: var(--dark);
          display: flex; align-items: center; justify-content: center;
          padding: 48px 64px;
          position: relative; overflow: hidden;
        }
        .right-panel::before {
          content: ''; position: absolute;
          bottom: -200px; right: -200px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.04), transparent);
          pointer-events: none;
        }

        .form-wrap { width: 100%; max-width: 420px; position: relative; z-index: 2; }

        .form-header { margin-bottom: 40px; }
        .form-step {
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .form-step::before {
          content: ''; width: 20px; height: 1px; background: var(--gold); opacity: 0.5;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem; font-weight: 900; line-height: 1.1; margin-bottom: 8px;
        }
        .form-subtitle { font-size: 0.88rem; color: var(--text-muted); font-weight: 300; }

        /* DIVIDER */
        .divider {
          height: 1px; background: rgba(201,168,76,0.1); margin: 32px 0;
        }

        /* FIELD */
        .field { margin-bottom: 20px; }
        .field-label {
          font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 8px; display: block;
        }
        .field-wrap { position: relative; }
        .field-input {
          width: 100%; background: var(--dark2);
          border: 1px solid rgba(201,168,76,0.1);
          color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          padding: 14px 16px; outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          -webkit-appearance: none; appearance: none;
        }
        .field-input::placeholder { color: rgba(122,138,121,0.5); }
        .field-input:focus {
          border-color: rgba(201,168,76,0.5);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.06);
        }
        .field-input.has-icon { padding-right: 48px; }
        .eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted); cursor: none;
          font-size: 16px; transition: color 0.2s; padding: 4px;
        }
        .eye-btn:hover { color: var(--gold); }

        /* MESSAGES */
        .msg {
          padding: 12px 16px; font-size: 0.82rem; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .msg-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #FCA5A5; }
        .msg-success { background: rgba(61,186,110,0.08); border: 1px solid rgba(61,186,110,0.2); color: #6EE7A0; }
        .msg-icon { font-size: 14px; flex-shrink: 0; }

        /* SUBMIT */
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
        .btn-submit::after {
          content: ''; position: absolute; inset: 0; background: white; opacity: 0; transition: opacity 0.3s;
        }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(201,168,76,0.3); }
        .btn-submit:not(:disabled):hover::after { opacity: 0.08; }
        .btn-submit:disabled { opacity: 0.7; }
        .spinner {
          width: 18px; height: 18px; border: 2px solid rgba(8,12,7,0.3);
          border-top-color: var(--dark); border-radius: 50%;
          animation: spin 0.7s linear infinite; margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* SWITCH LINK */
        .switch-row { text-align: center; margin-top: 28px; font-size: 0.85rem; color: var(--text-muted); }
        .switch-link {
          color: var(--gold); background: none; border: none;
          cursor: none; font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          font-weight: 500; transition: color 0.2s; text-decoration: underline; text-underline-offset: 3px;
        }
        .switch-link:hover { color: var(--gold-light); }

        /* TERMS */
        .terms { font-size: 0.75rem; color: rgba(122,138,121,0.5); text-align: center; margin-top: 20px; line-height: 1.6; }
        .terms a { color: var(--gold-dim); text-decoration: none; }

        /* PROGRESS BAR */
        .strength-wrap { margin-top: 6px; display: flex; gap: 4px; }
        .strength-bar { flex: 1; height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; transition: background 0.3s; }
        .strength-bar.s1.active { background: #ef4444; }
        .strength-bar.s2.active { background: #f97316; }
        .strength-bar.s3.active { background: var(--gold); }
        .strength-bar.s4.active { background: var(--green-bright); }

        @media (max-width: 900px) {
          .page { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .right-panel { padding: 40px 28px; }
        }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />

      <div className={`page ${isLoaded ? 'loaded' : ''}`}>

        {/* LEFT DECORATIVE PANEL */}
        <div className="left-panel">
          <div className="left-bg" />
          <div className="left-grid" />
          <div className="left-orb orb1" />
          <div className="left-orb orb2" />

          <div className="left-logo" onClick={() => router.push('/')}>
            <div className="logo-icon">⛳</div>
            Golf<span className="logo-gold">Charity</span>
          </div>

          <div className="left-body">
            <div className="left-eyebrow">
              <span className="eyebrow-dot" />
              Join the Community
            </div>
            <h2 className="left-title">
              Play.<br />
              <span className="outline">Win.</span><br />
              <span className="bright">Give Back.</span>
            </h2>
            <p className="left-desc">
              Create your account and join 12,400+ golfers who play, compete,
              and fund the causes that matter — all on one platform.
            </p>
            <div className="stats-row">
              <div className="stat">
                <div className="stat-val">£340K</div>
                <div className="stat-lbl">Donated</div>
              </div>
              <div className="stat">
                <div className="stat-val">12K+</div>
                <div className="stat-lbl">Players</div>
              </div>
              <div className="stat">
                <div className="stat-val">£5K</div>
                <div className="stat-lbl">Monthly Prize</div>
              </div>
            </div>
            <div className="pills">
              {['Monthly Prize Draws', 'Charity of Your Choice', 'Score Tracking', 'Free First Month'].map((p, i) => (
                <div key={i} className="pill"><span className="pill-dot" />{p}</div>
              ))}
            </div>
          </div>

          <div className="left-footer">
            <div className="left-footer-text">© 2026 GolfCharity Platform Ltd.</div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="right-panel">
          <div className="form-wrap">

            <div className="form-header">
              <div className="form-step">Step 1 of 1 — Account Setup</div>
              <h1 className="form-title">Create your<br />account</h1>
              <p className="form-subtitle">First month free. No card required to start.</p>
            </div>

            {errorMsg && (
              <div className="msg msg-error">
                <span className="msg-icon">⚠</span> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="msg msg-success">
                <span className="msg-icon">✓</span> {successMsg}
              </div>
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
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <input
                  className="field-input has-icon"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
                <button className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {password.length > 0 && (
                <div className="strength-wrap">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`strength-bar s${n} ${password.length >= n * 3 ? 'active' : ''}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label className="field-label">Confirm Password</label>
              <div className="field-wrap">
                <input
                  className="field-input has-icon"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
                <button className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="divider" />

            <button className="btn-submit" onClick={handleSignup} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Account →'}
            </button>

            <div className="switch-row">
              Already have an account?{' '}
              <button className="switch-link" onClick={() => router.push('/login')}>Sign in</button>
            </div>

            <div className="terms">
              By creating an account you agree to our{' '}
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>

          </div>
        </div>
      </div>
    </>
  )
}