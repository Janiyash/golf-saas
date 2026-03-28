'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userName, setUserName] = useState('Member')
  const [plan, setPlan] = useState('Pro Monthly')
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const h = (e: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${e.clientX-20}px,${e.clientY-20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX-4}px,${e.clientY-4}px)`
    }
    window.addEventListener('mousemove', h)
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      const { data } = await supabase.from('users').select('name,subscription_status').eq('email', user.email).single()
      if (data) { setName(data.name || ''); setUserName(data.name || user.email?.split('@')[0] || 'Member') }
      const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', data?.id).eq('status','active').maybeSingle()
      if (sub) setPlan(sub.plan === 'yearly' ? 'Pro Yearly' : 'Pro Monthly')
      setLoading(false)
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true); setMsg({ text: '', type: '' })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: appUser } = await supabase.from('users').select('id').eq('email', user.email).single()
    if (appUser) await supabase.from('users').update({ name }).eq('id', appUser.id)
    setMsg({ text: '✓ Profile updated successfully!', type: 'success' })
    setSaving(false)
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) { setMsg({ text: 'Password must be at least 6 characters', type: 'error' }); return }
    if (newPassword !== confirmPassword) { setMsg({ text: 'Passwords do not match', type: 'error' }); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setMsg({ text: error.message, type: 'error' }); setSaving(false); return }
    setMsg({ text: '✓ Password updated!', type: 'success' })
    setNewPassword(''); setConfirmPassword('')
    setSaving(false)
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--gold-dim:#8B6914;--green:#1A4A2E;--green-mid:#2D6A44;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--dark3:#111A12;--text-muted:#7A8A79;--border:rgba(201,168,76,.1);--sidebar-w:260px;}
        html{cursor:none;} body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);overflow-x:hidden;}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .dash-wrap{display:flex;min-height:100vh;opacity:0;transition:opacity .6s;} .dash-wrap.loaded{opacity:1;}
        .main{flex:1;margin-left:var(--sidebar-w);min-height:100vh;display:flex;flex-direction:column;margin-top:64px;}
        .topbar{height:64px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 32px;background:rgba(8,12,7,.6);backdrop-filter:blur(20px);position:sticky;top:0;z-index:40;}
        .topbar-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);}
        .content{flex:1;padding:32px;max-width:760px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:32px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);margin-bottom:24px;}
        .field{margin-bottom:20px;}
        .field-label{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;display:block;}
        .field-input{width:100%;background:var(--dark);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.95rem;padding:12px 16px;outline:none;transition:border-color .25s;}
        .field-input::placeholder{color:rgba(122,138,121,.5);}
        .field-input:focus{border-color:rgba(201,168,76,.4);}
        .field-input:disabled{opacity:.5;}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .msg{padding:12px 16px;font-size:.82rem;margin-bottom:20px;display:flex;align-items:center;gap:10px;}
        .msg-success{background:rgba(61,186,110,.08);border:1px solid rgba(61,186,110,.2);color:#6EE7A0;}
        .msg-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#FCA5A5;}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:12px 28px;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:transform .2s,box-shadow .3s;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(201,168,76,.25);}
        .btn-primary:disabled{opacity:.7;}
        .avatar-wrap{display:flex;align-items:center;gap:24px;margin-bottom:28px;}
        .avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#2D6A44,#1A4A2E);border:2px solid rgba(201,168,76,.3);display:flex;align-items:center;justify-content:center;font-size:2rem;}
        .avatar-info h3{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;}
        .avatar-info p{font-size:.8rem;color:var(--text-muted);margin-top:4px;}
        .spinner{width:16px;height:16px;border:2px solid rgba(8,12,7,.3);border-top-color:var(--dark);border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.form-row{grid-template-columns:1fr;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} plan={plan} />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Profile</span></div>
          <div className="content">
            {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
            <div className="card">
              <div className="section-eyebrow">Account</div>
              <h2 className="section-title">Personal Information</h2>
              <div className="avatar-wrap">
                <div className="avatar">🏌️</div>
                <div className="avatar-info"><h3>{userName}</h3><p>{email}</p></div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <input className="field-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input className="field-input" value={email} disabled />
                </div>
              </div>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save Changes →'}
              </button>
            </div>

            <div className="card">
              <div className="section-eyebrow">Security</div>
              <h2 className="section-title">Change Password</h2>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">New Password</label>
                  <input className="field-input" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Confirm Password</label>
                  <input className="field-input" type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <button className="btn-primary" onClick={handleSavePassword} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Update Password →'}
              </button>
            </div>

            <div className="card" style={{borderColor:'rgba(239,68,68,.15)'}}>
              <div className="section-eyebrow">Danger Zone</div>
              <h2 className="section-title" style={{color:'#FCA5A5'}}>Delete Account</h2>
              <p style={{color:'var(--text-muted)',fontSize:'.88rem',marginBottom:'20px',lineHeight:1.6}}>Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button style={{background:'none',border:'1px solid rgba(239,68,68,.3)',color:'#FCA5A5',padding:'10px 22px',fontFamily:"'DM Sans',sans-serif",fontSize:'.82rem',cursor:'pointer',transition:'all .2s'}}>
                Delete My Account
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
