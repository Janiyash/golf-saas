'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function AdminReports() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [data, setData] = useState({ users:0, active:0, draws:0, winners:0, totalPrize:0, totalDonations:0, charities:0, avgScore:0 })
  const [topCharities, setTopCharities] = useState<any[]>([])
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const [drawHistory, setDrawHistory] = useState<any[]>([])
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
      const [{ data: users }, { data: draws }, { data: winners }, { data: charities }, { data: scores }] = await Promise.all([
        supabase.from('users').select('id,subscription_status'),
        supabase.from('draws').select('id,month,status'),
        supabase.from('winners').select('id,prize_amount,status'),
        supabase.from('charities').select('name,total_donations').order('total_donations',{ascending:false}).limit(5),
        supabase.from('scores').select('score'),
      ])
      const totalPrize = (winners||[]).reduce((s:number,w:any)=>s+(parseFloat(w.prize_amount)||0),0)
      const totalDonations = (charities||[]).reduce((s:number,c:any)=>s+(c.total_donations||0),0)
      const avgScore = scores && scores.length ? ((scores||[]).reduce((s:any,sc:any)=>s+sc.score,0)/scores.length).toFixed(1) : 0
      setData({ users:(users||[]).length, active:(users||[]).filter((u:any)=>u.subscription_status==='active').length, draws:(draws||[]).length, winners:(winners||[]).length, totalPrize, totalDonations, charities:(charities||[]).length, avgScore:parseFloat(String(avgScore)) })
      setTopCharities(charities||[])
      setRecentWinners((winners||[]).slice(0,5))
      setDrawHistory((draws||[]).slice(0,6))
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const convRate = data.users > 0 ? Math.round((data.active/data.users)*100) : 0

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
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-bottom:24px;}
        .stat-card{background:var(--dark2);padding:24px 28px;position:relative;overflow:hidden;transition:background .2s;}
        .stat-card:hover{background:var(--dark3);}
        .stat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform:scaleX(0);transition:transform .3s;}
        .stat-card:hover::after{transform:scaleX(1);}
        .stat-num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--gold);line-height:1;}
        .stat-num.green{color:var(--green-bright);}
        .stat-label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:6px;}
        .stat-trend{font-size:.75rem;color:var(--green-bright);margin-top:4px;}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--cream);margin-bottom:20px;}
        .charity-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(201,168,76,.06);}
        .charity-row:last-child{border-bottom:none;}
        .charity-name-sm{font-size:.85rem;flex:1;color:var(--cream);}
        .charity-amount-sm{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--green-bright);}
        .bar-horiz{height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;width:80px;}
        .bar-fill{height:100%;background:linear-gradient(90deg,var(--green-mid),var(--green-bright));border-radius:2px;}
        .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
        .kpi{background:var(--dark2);border:1px solid var(--border);padding:20px 24px;}
        .kpi-val{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;color:var(--gold);}
        .kpi-lbl{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-top:4px;}
        .draw-hist{display:flex;flex-direction:column;gap:8px;}
        .draw-hist-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(201,168,76,.04);}
        .draw-hist-row:last-child{border-bottom:none;}
        .draw-hist-month{font-size:.85rem;color:var(--cream);}
        .badge{display:inline-block;padding:3px 8px;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;border:1px solid;}
        .badge-green{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .badge-gold{border-color:rgba(201,168,76,.3);color:var(--gold);}
        @media(max-width:1024px){.grid-2{grid-template-columns:1fr;}.stats-grid{grid-template-columns:repeat(2,1fr);}.main{margin-left:0;}.content{padding:20px 16px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar isAdmin userName="Admin" />
        <main className="main">
          <div className="topbar">
            <span className="topbar-title">Reports & Analytics</span>
            <button style={{background:'none',border:'1px solid rgba(201,168,76,.2)',color:'var(--gold)',padding:'8px 16px',fontFamily:"'DM Sans',sans-serif",fontSize:'.78rem',letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer'}} onClick={() => window.print()}>Export Report</button>
          </div>
          <div className="content">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-num">{data.users}</div><div className="stat-trend">+12% this month</div></div>
              <div className="stat-card"><div className="stat-label">Active Subscribers</div><div className="stat-num green">{data.active}</div><div className="stat-trend">{convRate}% conversion</div></div>
              <div className="stat-card"><div className="stat-label">Prize Paid Out</div><div className="stat-num" style={{fontSize:'1.5rem'}}>£{data.totalPrize.toFixed(0)}</div><div className="stat-trend">Across {data.winners} winners</div></div>
              <div className="stat-card"><div className="stat-label">Charity Donations</div><div className="stat-num green" style={{fontSize:'1.5rem'}}>£{data.totalDonations.toLocaleString()}</div><div className="stat-trend">Combined total</div></div>
            </div>
            <div className="kpi-grid">
              {[
                {v:`${convRate}%`,l:'Conversion Rate'},
                {v:data.draws,l:'Total Draws Run'},
                {v:data.avgScore||'—',l:'Avg Player Score'},
                {v:data.charities,l:'Charity Partners'},
              ].map((k,i) => (
                <div key={i} className="kpi"><div className="kpi-val">{k.v}</div><div className="kpi-lbl">{k.l}</div></div>
              ))}
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="section-eyebrow">Charity Impact</div>
                <div className="section-title">Top Funded Causes</div>
                {topCharities.map((c, i) => {
                  const maxD = Math.max(...topCharities.map((ch:any)=>ch.total_donations||0),1)
                  const pct = Math.round(((c.total_donations||0)/maxD)*100)
                  return (
                    <div key={i} className="charity-row">
                      <div className="charity-name-sm">{c.name}</div>
                      <div className="bar-horiz"><div className="bar-fill" style={{width:`${pct}%`}} /></div>
                      <div className="charity-amount-sm">£{(c.total_donations||0).toLocaleString()}</div>
                    </div>
                  )
                })}
                {topCharities.length===0&&<div style={{color:'var(--text-muted)',fontSize:'.85rem'}}>No charity data yet.</div>}
              </div>
              <div className="card">
                <div className="section-eyebrow">Draw History</div>
                <div className="section-title">Recent Draws</div>
                <div className="draw-hist">
                  {drawHistory.map((d, i) => (
                    <div key={i} className="draw-hist-row">
                      <div className="draw-hist-month">{d.month}</div>
                      <span className={`badge ${d.status==='published'?'badge-green':'badge-gold'}`}>{d.status}</span>
                    </div>
                  ))}
                  {drawHistory.length===0&&<div style={{color:'var(--text-muted)',fontSize:'.85rem'}}>No draws yet.</div>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
