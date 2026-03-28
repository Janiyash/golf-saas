'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function AdminCharities() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [charities, setCharities] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [msg, setMsg] = useState({ text: '', type: '' })
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
      const { data: appUser } = await supabase.from('users').select('role').eq('email', user.email).single()
      if (appUser?.role !== 'admin') { router.push('/dashboard'); return }
      const { data } = await supabase.from('charities').select('*').order('total_donations', { ascending: false })
      setCharities(data || [])
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const handleAdd = async () => {
    if (!newName) { setMsg({ text: 'Name is required', type: 'error' }); return }
    const { data, error } = await supabase.from('charities').insert([{ name: newName, description: newDesc, total_donations: 0 }]).select().single()
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setCharities(prev => [data, ...prev])
    setNewName(''); setNewDesc('')
    setMsg({ text: '✓ Charity added!', type: 'success' })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this charity partner?')) return
    await supabase.from('charities').delete().eq('id', id)
    setCharities(prev => prev.filter(c => c.id !== id))
  }

  const ICONS = ['🏥','🎗️','🧠','❤️','⛵','🌍','🐾','🏫']

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
        .content{flex:1;padding:32px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);margin-bottom:20px;}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;}
        .field-grp{display:flex;flex-direction:column;gap:6px;}
        .field-lbl{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .field-inp{background:var(--dark);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:10px 14px;outline:none;transition:border-color .2s;width:100%;}
        .field-inp:focus{border-color:rgba(201,168,76,.35);}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:transform .2s,box-shadow .2s;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(201,168,76,.25);}
        .msg{padding:10px 14px;font-size:.8rem;margin-top:12px;display:flex;align-items:center;gap:8px;}
        .msg-success{background:rgba(61,186,110,.08);border:1px solid rgba(61,186,110,.2);color:#6EE7A0;}
        .msg-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#FCA5A5;}
        .charity-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
        .charity-item{background:var(--dark);border:1px solid rgba(201,168,76,.08);padding:24px;position:relative;overflow:hidden;transition:border-color .2s;}
        .charity-item:hover{border-color:rgba(201,168,76,.18);}
        .charity-item::before{content:'';position:absolute;top:0;left:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--green-bright),var(--green-mid));}
        .ci-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;}
        .ci-icon{width:44px;height:44px;border-radius:2px;background:rgba(29,74,46,.3);border:1px solid rgba(61,186,110,.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
        .ci-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;margin-bottom:4px;}
        .ci-desc{font-size:.8rem;color:var(--text-muted);line-height:1.55;}
        .ci-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid rgba(201,168,76,.06);}
        .ci-amount{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--green-bright);}
        .ci-lbl{font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
        .btn-danger{background:none;border:1px solid rgba(239,68,68,.2);color:#FCA5A5;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.72rem;cursor:pointer;transition:all .2s;}
        .btn-danger:hover{background:rgba(239,68,68,.06);}
        .progress-bar{height:2px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;margin-top:8px;}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--green-mid),var(--green-bright));border-radius:2px;}
        @media(max-width:900px){.form-grid{grid-template-columns:1fr;}.charity-grid{grid-template-columns:1fr;}.main{margin-left:0;}.content{padding:20px 16px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Manage Charities</span></div>
          <div className="content">
            <div className="card">
              <div className="section-eyebrow">Add Partner</div>
              <div className="section-title">Add New Charity</div>
              <div className="form-grid">
                <div className="field-grp"><label className="field-lbl">Charity Name</label><input className="field-inp" placeholder="e.g. Cancer Research UK" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div className="field-grp"><label className="field-lbl">Description</label><input className="field-inp" placeholder="Short description..." value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
                <button className="btn-primary" onClick={handleAdd}>Add →</button>
              </div>
              {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
            </div>
            <div className="card">
              <div className="section-eyebrow">Partners</div>
              <div className="section-head"><div className="section-title">All Charities ({charities.length})</div></div>
              <div className="charity-grid">
                {charities.map((c, i) => {
                  const maxDon = Math.max(...charities.map((ch: any) => ch.total_donations || 0), 1)
                  const pct = Math.round(((c.total_donations || 0) / maxDon) * 100)
                  return (
                    <div key={i} className="charity-item">
                      <div className="ci-header">
                        <div className="ci-icon">{ICONS[i % ICONS.length]}</div>
                        <div><div className="ci-name">{c.name}</div><div className="ci-desc">{c.description || 'No description provided.'}</div></div>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="ci-footer">
                        <div><div className="ci-lbl">Total Raised</div><div className="ci-amount">£{(c.total_donations || 0).toLocaleString()}</div></div>
                        <button className="btn-danger" onClick={() => handleDelete(c.id)}>Remove</button>
                      </div>
                    </div>
                  )
                })}
                {charities.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', gridColumn: '1/-1' }}>No charities yet.</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
