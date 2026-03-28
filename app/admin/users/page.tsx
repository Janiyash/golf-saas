'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function AdminUsers() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
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
      const { data } = await supabase.from('users').select('id,name,email,role,subscription_status,charity_percentage').order('id', { ascending: false })
      setUsers(data || [])
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.subscription_status === filter || (filter === 'admin' && u.role === 'admin')
    return matchSearch && matchFilter
  })

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('users').update({ role: newRole }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    await supabase.from('users').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
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
        .topbar{height:64px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:rgba(8,12,7,.6);backdrop-filter:blur(20px);position:sticky;top:0;z-index:40;}
        .topbar-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);}
        .content{flex:1;padding:32px;}
        .toolbar{display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
        .search-input{background:var(--dark2);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:10px 16px;outline:none;transition:border-color .2s;flex:1;min-width:200px;}
        .search-input::placeholder{color:rgba(122,138,121,.5);}
        .search-input:focus{border-color:rgba(201,168,76,.35);}
        .filter-btn{background:none;border:1px solid rgba(201,168,76,.12);color:var(--text-muted);font-family:'DM Sans',sans-serif;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;padding:9px 16px;cursor:pointer;transition:all .2s;}
        .filter-btn.active{background:rgba(201,168,76,.08);border-color:rgba(201,168,76,.3);color:var(--gold);}
        .filter-btn:hover{border-color:rgba(201,168,76,.25);color:var(--cream);}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);}
        td{padding:12px 14px;font-size:.85rem;border-bottom:1px solid rgba(201,168,76,.04);}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(201,168,76,.02);}
        .badge{display:inline-block;padding:3px 8px;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;border:1px solid;}
        .badge-green{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .badge-red{border-color:rgba(239,68,68,.3);color:#FCA5A5;}
        .badge-gold{border-color:rgba(201,168,76,.3);color:var(--gold);}
        .badge-muted{border-color:rgba(122,138,121,.2);color:var(--text-muted);}
        .actions{display:flex;gap:6px;}
        .btn-sm{background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s;white-space:nowrap;}
        .btn-sm:hover{background:rgba(201,168,76,.06);border-color:rgba(201,168,76,.4);}
        .btn-danger{background:none;border:1px solid rgba(239,68,68,.2);color:#FCA5A5;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:.7rem;cursor:pointer;transition:all .2s;}
        .btn-danger:hover{background:rgba(239,68,68,.06);}
        .user-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2D6A44,#1A4A2E);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;}
        .user-cell{display:flex;align-items:center;gap:10px;}
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-bottom:24px;}
        .sc{background:var(--dark2);padding:20px 24px;}
        .sc-num{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;color:var(--gold);}
        .sc-lbl{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:4px;}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.stats-row{grid-template-columns:1fr 1fr;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" />
        <main className="main">
          <div className="topbar"><span className="topbar-title">User Management</span></div>
          <div className="content">
            <div className="stats-row">
              <div className="sc"><div className="sc-num">{users.length}</div><div className="sc-lbl">Total Users</div></div>
              <div className="sc"><div className="sc-num sc-num" style={{color:'var(--green-bright)'}}>{users.filter(u=>u.subscription_status==='active').length}</div><div className="sc-lbl">Active Subscribers</div></div>
              <div className="sc"><div className="sc-num">{users.filter(u=>u.role==='admin').length}</div><div className="sc-lbl">Admins</div></div>
            </div>
            <div className="toolbar">
              <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
              {['all','active','inactive','admin'].map(f => (
                <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="card">
              <div className="section-eyebrow">Members</div>
              <div className="section-head">
                <div className="section-title">All Users ({filtered.length})</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Charity %</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map((u,i) => (
                      <tr key={i}>
                        <td><div className="user-cell"><div className="user-avatar">🏌️</div>{u.name||'Unnamed'}</div></td>
                        <td style={{color:'var(--text-muted)'}}>{u.email}</td>
                        <td><span className={`badge ${u.role==='admin'?'badge-gold':'badge-muted'}`}>{u.role}</span></td>
                        <td><span className={`badge ${u.subscription_status==='active'?'badge-green':'badge-red'}`}>{u.subscription_status||'inactive'}</span></td>
                        <td style={{color:'var(--gold)'}}>{u.charity_percentage||10}%</td>
                        <td><div className="actions">
                          <button className="btn-sm" onClick={() => handleToggleRole(u.id, u.role)}>{u.role==='admin'?'Demote':'Make Admin'}</button>
                          <button className="btn-danger" onClick={() => handleDeleteUser(u.id)}>✕</button>
                        </div></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:'32px'}}>No users found.</td></tr>}
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
