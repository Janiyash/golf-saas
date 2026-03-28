'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { matchTypeToLabel } from '@/utils/helpers'

export default function AdminWinners() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [winners, setWinners] = useState<any[]>([])
  const [draws, setDraws] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [userId, setUserId] = useState('')
  const [drawId, setDrawId] = useState('')
  const [matchType, setMatchType] = useState('3')
  const [prizeAmount, setPrizeAmount] = useState('')
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
      const [{ data: wn }, { data: dr }, { data: us }] = await Promise.all([
        supabase.from('winners').select('*').order('created_at', { ascending: false }),
        supabase.from('draws').select('id,month,status'),
        supabase.from('users').select('id,name,email'),
      ])
      setWinners(wn || []); setDraws(dr || []); setUsers(us || [])
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const handleCreate = async () => {
    if (!userId || !drawId || !prizeAmount) { setMsg({ text: 'All fields are required', type: 'error' }); return }
    const { data, error } = await supabase.from('winners').insert([{ user_id: userId, draw_id: drawId, match_type: parseInt(matchType), prize_amount: parseFloat(prizeAmount), status: 'pending' }]).select().single()
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setWinners(prev => [data, ...prev])
    setUserId(''); setDrawId(''); setPrizeAmount('')
    setMsg({ text: '✓ Winner record created!', type: 'success' })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const handleVerify = async (id: string) => {
    await supabase.from('winners').update({ status: 'paid' }).eq('id', id)
    setWinners(prev => prev.map(w => w.id === id ? { ...w, status: 'paid' } : w))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this winner record?')) return
    await supabase.from('winners').delete().eq('id', id)
    setWinners(prev => prev.filter(w => w.id !== id))
  }

  const filtered = winners.filter(w => filter === 'all' || w.status === filter)
  const getUserLabel = (uid: string) => { const u = users.find(u => u.id === uid); return u ? (u.name || u.email) : uid }
  const getDrawLabel = (did: string) => { const d = draws.find(d => d.id === did); return d ? d.month : did }

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
        .form-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:12px;align-items:end;}
        .field-grp{display:flex;flex-direction:column;gap:6px;}
        .field-lbl{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .field-inp,.field-select{background:var(--dark);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.85rem;padding:10px 14px;outline:none;transition:border-color .2s;width:100%;}
        .field-inp:focus,.field-select:focus{border-color:rgba(201,168,76,.35);}
        .field-select{cursor:pointer;}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:transform .2s;}
        .btn-primary:hover{transform:translateY(-1px);}
        .msg{padding:10px 14px;font-size:.8rem;margin-top:12px;}
        .msg-success{background:rgba(61,186,110,.08);border:1px solid rgba(61,186,110,.2);color:#6EE7A0;}
        .msg-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#FCA5A5;}
        .toolbar{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
        .filter-btn{background:none;border:1px solid rgba(201,168,76,.12);color:var(--text-muted);font-family:'DM Sans',sans-serif;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;cursor:pointer;transition:all .2s;}
        .filter-btn.active{background:rgba(201,168,76,.08);border-color:rgba(201,168,76,.3);color:var(--gold);}
        .filter-btn:hover{border-color:rgba(201,168,76,.25);color:var(--cream);}
        .table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);}
        td{padding:12px 14px;font-size:.85rem;border-bottom:1px solid rgba(201,168,76,.04);}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(201,168,76,.02);}
        .badge{display:inline-block;padding:3px 8px;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;border:1px solid;}
        .badge-green{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .badge-gold{border-color:rgba(201,168,76,.3);color:var(--gold);}
        .actions{display:flex;gap:6px;}
        .btn-sm{background:none;border:1px solid rgba(61,186,110,.3);color:var(--green-bright);padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.7rem;cursor:pointer;transition:all .2s;}
        .btn-sm:hover{background:rgba(61,186,110,.06);}
        .btn-danger{background:none;border:1px solid rgba(239,68,68,.2);color:#FCA5A5;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.7rem;cursor:pointer;}
        .btn-danger:hover{background:rgba(239,68,68,.06);}
        @media(max-width:1024px){.form-grid{grid-template-columns:1fr 1fr;}.main{margin-left:0;}.content{padding:20px 16px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Manage Winners</span></div>
          <div className="content">
            <div className="card">
              <div className="section-eyebrow">Record</div>
              <div className="section-title">Add Winner Record</div>
              <div className="form-grid">
                <div className="field-grp">
                  <label className="field-lbl">User</label>
                  <select className="field-select" value={userId} onChange={e => setUserId(e.target.value)}>
                    <option value="">Select user...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                  </select>
                </div>
                <div className="field-grp">
                  <label className="field-lbl">Draw</label>
                  <select className="field-select" value={drawId} onChange={e => setDrawId(e.target.value)}>
                    <option value="">Select draw...</option>
                    {draws.map(d => <option key={d.id} value={d.id}>{d.month}</option>)}
                  </select>
                </div>
                <div className="field-grp">
                  <label className="field-lbl">Match Type</label>
                  <select className="field-select" value={matchType} onChange={e => setMatchType(e.target.value)}>
                    <option value="3">3 Numbers</option>
                    <option value="4">4 Numbers</option>
                    <option value="5">5 Numbers (Jackpot)</option>
                  </select>
                </div>
                <div className="field-grp">
                  <label className="field-lbl">Prize Amount (£)</label>
                  <input className="field-inp" type="number" placeholder="0.00" value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={handleCreate}>Add →</button>
              </div>
              {msg.text && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
            </div>
            <div className="card">
              <div className="section-eyebrow">Records</div>
              <div className="section-head"><div className="section-title">Winner Records ({filtered.length})</div></div>
              <div className="toolbar">
                {['all','pending','paid'].map(f => (
                  <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Draw</th><th>Match</th><th>Prize</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map((w, i) => (
                      <tr key={i}>
                        <td>{getUserLabel(w.user_id)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{getDrawLabel(w.draw_id)}</td>
                        <td>{matchTypeToLabel(w.match_type)}</td>
                        <td style={{ color: 'var(--green-bright)', fontFamily: 'Playfair Display,serif', fontWeight: 700 }}>£{parseFloat(w.prize_amount || 0).toFixed(2)}</td>
                        <td><span className={`badge ${w.status === 'paid' ? 'badge-green' : 'badge-gold'}`}>{w.status}</span></td>
                        <td><div className="actions">
                          {w.status !== 'paid' && <button className="btn-sm" onClick={() => handleVerify(w.id)}>✓ Verify</button>}
                          <button className="btn-danger" onClick={() => handleDelete(w.id)}>✕</button>
                        </div></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No winners found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
