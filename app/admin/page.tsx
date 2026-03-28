'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function AdminOverview() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [stats, setStats] = useState({ users:0, draws:0, winners:0, charities:0, totalPrize:0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
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
      const [{ count: uc }, { count: dc }, { count: wc }, { count: cc }, { data: wn }, { data: ru }] = await Promise.all([
        supabase.from('users').select('*',{count:'exact',head:true}),
        supabase.from('draws').select('*',{count:'exact',head:true}),
        supabase.from('winners').select('*',{count:'exact',head:true}),
        supabase.from('charities').select('*',{count:'exact',head:true}),
        supabase.from('winners').select('prize_amount'),
        supabase.from('users').select('id,name,email,role,subscription_status').order('id',{ascending:false}).limit(5),
      ])
      const totalPrize = (wn||[]).reduce((s:number,w:any) => s+(parseFloat(w.prize_amount)||0),0)
      setStats({users:uc||0,draws:dc||0,winners:wc||0,charities:cc||0,totalPrize})
      setRecentUsers(ru||[])
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

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
        .admin-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);padding:4px 12px;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);}
        .content{flex:1;padding:32px;}
        .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--border);margin-bottom:24px;}
        .stat-card{background:var(--dark2);padding:24px 20px;position:relative;overflow:hidden;transition:background .2s;}
        .stat-card:hover{background:var(--dark3);}
        .stat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform:scaleX(0);transition:transform .3s;}
        .stat-card:hover::after{transform:scaleX(1);}
        .stat-num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--gold);line-height:1;}
        .stat-num.green{color:var(--green-bright);}
        .stat-label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:6px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);}
        td{padding:12px 14px;font-size:.85rem;border-bottom:1px solid rgba(201,168,76,.04);}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(201,168,76,.02);}
        .badge{display:inline-block;padding:3px 8px;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;border:1px solid;}
        .badge-green{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .badge-red{border-color:rgba(239,68,68,.3);color:#FCA5A5;}
        .badge-muted{border-color:rgba(122,138,121,.2);color:var(--text-muted);}
        .badge-gold{border-color:rgba(201,168,76,.3);color:var(--gold);}
        .btn-sm{background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s;}
        .btn-sm:hover{background:rgba(201,168,76,.06);border-color:rgba(201,168,76,.4);}
        .quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
        .qa-card{background:var(--dark2);border:1px solid rgba(201,168,76,.08);padding:24px;cursor:pointer;transition:border-color .3s,transform .2s;position:relative;overflow:hidden;}
        .qa-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(29,74,46,.15),transparent);opacity:0;transition:opacity .3s;}
        .qa-card:hover{border-color:rgba(201,168,76,.2);transform:translateY(-2px);}
        .qa-card:hover::before{opacity:1;}
        .qa-icon{font-size:1.8rem;margin-bottom:12px;}
        .qa-title{font-size:.9rem;font-weight:500;margin-bottom:4px;}
        .qa-sub{font-size:.78rem;color:var(--text-muted);}
        @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(3,1fr);}.quick-actions{grid-template-columns:1fr 1fr;}}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.stats-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" plan="Admin Access" />
        <main className="main">
          <div className="topbar">
            <span className="topbar-title">Admin Overview</span>
            <div className="admin-badge">🛡️ Admin Panel</div>
          </div>
          <div className="content">
            <div className="stats-grid">
              {[
                {label:'Total Users',val:stats.users,green:false},
                {label:'Prize Draws',val:stats.draws,green:false},
                {label:'Total Winners',val:stats.winners,green:true},
                {label:'Charities',val:stats.charities,green:false},
                {label:'Total Paid Out',val:`£${stats.totalPrize.toFixed(0)}`,green:true},
              ].map((s,i) => (
                <div key={i} className="stat-card"><div className={`stat-num${s.green?' green':''}`}>{s.val}</div><div className="stat-label">{s.label}</div></div>
              ))}
            </div>
            <div className="quick-actions">
              {[
                {icon:'👥',title:'Manage Users',sub:'View, edit, and manage all users',href:'/admin/users'},
                {icon:'🎲',title:'Prize Draws',sub:'Create and manage monthly draws',href:'/admin/draws'},
                {icon:'🏆',title:'Winners',sub:'Review and verify winner claims',href:'/admin/winners'},
                {icon:'💚',title:'Charities',sub:'Manage charity partners',href:'/admin/charities'},
                {icon:'📊',title:'Reports',sub:'Platform analytics & reports',href:'/admin/reports'},
                {icon:'⛳',title:'Dashboard',sub:'View your player dashboard',href:'/dashboard'},
              ].map((qa,i) => (
                <div key={i} className="qa-card" onClick={() => router.push(qa.href)}>
                  <div className="qa-icon">{qa.icon}</div>
                  <div className="qa-title">{qa.title}</div>
                  <div className="qa-sub">{qa.sub}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="section-eyebrow">Latest Registrations</div>
              <div className="section-head">
                <div className="section-title">Recent Users</div>
                <button className="btn-sm" onClick={() => router.push('/admin/users')}>View All →</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentUsers.map((u,i) => (
                      <tr key={i}>
                        <td>{u.name||'—'}</td>
                        <td style={{color:'var(--text-muted)'}}>{u.email}</td>
                        <td><span className={`badge ${u.role==='admin'?'badge-gold':'badge-muted'}`}>{u.role}</span></td>
                        <td><span className={`badge ${u.subscription_status==='active'?'badge-green':'badge-red'}`}>{u.subscription_status}</span></td>
                      </tr>
                    ))}
                    {recentUsers.length === 0 && <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-muted)',padding:'32px'}}>No users yet</td></tr>}
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
