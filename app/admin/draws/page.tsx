'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function AdminDraws() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [draws, setDraws] = useState<any[]>([])
  const [newMonth, setNewMonth] = useState('')
  const [newNumbers, setNewNumbers] = useState('')
  const [newType, setNewType] = useState('random')
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
      const { data } = await supabase.from('draws').select('*').order('month', { ascending: false })
      setDraws(data || [])
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const handleCreate = async () => {
    if (!newMonth) { setMsg({ text: 'Month is required', type: 'error' }); return }
    const nums = newNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 45)
    if (nums.length !== 5) { setMsg({ text: 'Enter exactly 5 numbers (1–45)', type: 'error' }); return }
    const { data, error } = await supabase.from('draws').insert([{ month: newMonth, numbers: nums, type: newType, status: 'draft' }]).select().single()
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setDraws(prev => [data, ...prev])
    setNewMonth(''); setNewNumbers('')
    setMsg({ text: '✓ Draw created!', type: 'success' })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const handlePublish = async (id: string) => {
    await supabase.from('draws').update({ status: 'published' }).eq('id', id)
    setDraws(prev => prev.map(d => d.id === id ? { ...d, status: 'published' } : d))
    setMsg({ text: '✓ Draw published! Winners will be notified.', type: 'success' })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draw?')) return
    await supabase.from('draws').delete().eq('id', id)
    setDraws(prev => prev.filter(d => d.id !== id))
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
        .content{flex:1;padding:32px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);margin-bottom:20px;}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;}
        .field-grp{display:flex;flex-direction:column;gap:6px;}
        .field-lbl{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .field-inp{background:var(--dark);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:10px 14px;outline:none;transition:border-color .2s;width:100%;}
        .field-inp:focus{border-color:rgba(201,168,76,.35);}
        .field-select{background:var(--dark);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:10px 14px;outline:none;width:100%;cursor:pointer;}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:transform .2s,box-shadow .2s;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(201,168,76,.25);}
        .msg{padding:10px 14px;font-size:.8rem;margin-top:12px;display:flex;align-items:center;gap:8px;}
        .msg-success{background:rgba(61,186,110,.08);border:1px solid rgba(61,186,110,.2);color:#6EE7A0;}
        .msg-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#FCA5A5;}
        .draw-grid{display:flex;flex-direction:column;gap:12px;}
        .draw-item{background:var(--dark);border:1px solid rgba(201,168,76,.08);padding:20px 24px;display:flex;align-items:center;gap:20px;transition:border-color .2s;flex-wrap:wrap;}
        .draw-item:hover{border-color:rgba(201,168,76,.18);}
        .draw-month{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;min-width:120px;}
        .draw-nums{display:flex;gap:8px;flex:1;}
        .draw-num{width:36px;height:36px;border-radius:50%;background:rgba(29,74,46,.25);border:1px solid rgba(61,186,110,.15);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:.85rem;font-weight:700;}
        .draw-type{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);}
        .draw-actions{display:flex;gap:8px;margin-left:auto;}
        .badge{display:inline-block;padding:3px 8px;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;border:1px solid;}
        .badge-gold{border-color:rgba(201,168,76,.3);color:var(--gold);}
        .badge-green{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .btn-sm{background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s;}
        .btn-sm:hover{background:rgba(201,168,76,.06);border-color:rgba(201,168,76,.4);}
        .btn-danger{background:none;border:1px solid rgba(239,68,68,.2);color:#FCA5A5;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.72rem;cursor:pointer;transition:all .2s;}
        .btn-danger:hover{background:rgba(239,68,68,.06);}
        @media(max-width:900px){.form-grid{grid-template-columns:1fr 1fr;}.main{margin-left:0;}.content{padding:20px 16px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Manage Draws</span></div>
          <div className="content">
            <div className="card">
              <div className="section-eyebrow">Create</div>
              <div className="section-title">New Prize Draw</div>
              <div className="form-grid">
                <div className="field-grp">
                  <label className="field-lbl">Month (e.g. April 2026)</label>
                  <input className="field-inp" placeholder="April 2026" value={newMonth} onChange={e => setNewMonth(e.target.value)} />
                </div>
                <div className="field-grp">
                  <label className="field-lbl">5 Numbers (1–45, comma separated)</label>
                  <input className="field-inp" placeholder="7, 14, 22, 31, 38" value={newNumbers} onChange={e => setNewNumbers(e.target.value)} />
                </div>
                <div className="field-grp">
                  <label className="field-lbl">Draw Type</label>
                  <select className="field-select" value={newType} onChange={e => setNewType(e.target.value)}>
                    <option value="random">Random</option>
                    <option value="algorithm">Algorithm</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={handleCreate}>Create Draw →</button>
              </div>
              {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
            </div>
            <div className="card">
              <div className="section-eyebrow">All Draws</div>
              <div className="section-head">
                <div className="section-title">Draw History ({draws.length})</div>
              </div>
              <div className="draw-grid">
                {draws.map((draw, i) => (
                  <div key={i} className="draw-item">
                    <div className="draw-month">{draw.month}</div>
                    <div className="draw-nums">
                      {(draw.numbers || []).map((n: number, j: number) => <div key={j} className="draw-num">{n}</div>)}
                    </div>
                    <div className="draw-type">{draw.type}</div>
                    <span className={`badge ${draw.status === 'published' ? 'badge-green' : 'badge-gold'}`}>{draw.status}</span>
                    <div className="draw-actions">
                      {draw.status === 'draft' && <button className="btn-sm" onClick={() => handlePublish(draw.id)}>Publish</button>}
                      <button className="btn-danger" onClick={() => handleDelete(draw.id)}>✕</button>
                    </div>
                  </div>
                ))}
                {draws.length === 0 && <div style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>No draws yet. Create your first draw above.</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
