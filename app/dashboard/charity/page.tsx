'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

const CHARITY_LIST = [
  {icon:'🏥',name:"St. Jude Children's Hospital",sub:"Children's healthcare · USA"},
  {icon:'🎗️',name:'Cancer Research UK',sub:'Cancer research · United Kingdom'},
  {icon:'🧠',name:"Alzheimer's Society",sub:'Dementia support · United Kingdom'},
  {icon:'❤️',name:'British Heart Foundation',sub:'Heart disease · United Kingdom'},
  {icon:'⛵',name:'RNLI',sub:'Sea rescue · United Kingdom & Ireland'},
]

export default function Charity() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [charityName, setCharityName] = useState('')
  const [charityPct, setCharityPct] = useState(15)
  const [totalDonated, setTotalDonated] = useState(0)
  const [userName, setUserName] = useState('Member')
  const [appUserId, setAppUserId] = useState<string|null>(null)
  const [memberSince, setMemberSince] = useState('')
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
      const { data: appUser } = await supabase.from('users').select('id,name,charity_id,charity_percentage').eq('email', user.email).single()
      if (appUser) {
        setUserName(appUser.name || user.email?.split('@')[0] || 'Member')
        setAppUserId(appUser.id)
        setCharityPct(appUser.charity_percentage || 15)
        if (appUser.charity_id) {
          const { data: ch } = await supabase.from('charities').select('name,total_donations').eq('id', appUser.charity_id).single()
          if (ch) { setCharityName(ch.name); setTotalDonated(ch.total_donations||0) }
        }
      }
      const { data: sub } = await supabase.from('subscriptions').select('start_date').eq('user_id', appUser?.id).order('start_date',{ascending:false}).limit(1).maybeSingle()
      if (sub) setMemberSince(sub.start_date)
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const monthsSince = (d: string) => { if(!d)return 0; const s=new Date(d),n=new Date(); return (n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth()) }
  const perMonth = (4.99 * charityPct / 100).toFixed(2)

  const handlePctChange = async (val: number) => {
    setCharityPct(val)
    if (!appUserId) return
    await supabase.from('users').update({ charity_percentage: val }).eq('id', appUserId)
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
        .charity-hero{background:var(--dark2);border:1px solid var(--border);padding:32px;margin-bottom:20px;position:relative;overflow:hidden;}
        .charity-hero::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--green-bright),var(--green-mid));}
        .charity-name-lg{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;margin-bottom:6px;}
        .charity-desc{font-size:.88rem;color:var(--text-muted);line-height:1.65;margin-bottom:24px;font-weight:300;max-width:580px;}
        .pct-row{display:flex;align-items:center;gap:24px;flex-wrap:wrap;}
        .pct-display{font-family:'Playfair Display',serif;font-size:3rem;font-weight:900;color:var(--green-bright);line-height:1;}
        .pct-label{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:4px;}
        .pct-slider-wrap{flex:1;min-width:200px;}
        .pct-slider{width:100%;-webkit-appearance:none;appearance:none;height:3px;background:rgba(255,255,255,.08);outline:none;border-radius:2px;cursor:pointer;}
        .pct-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:var(--green-bright);border-radius:50%;cursor:pointer;border:2px solid var(--dark2);}
        .impact-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px;}
        .impact-tile{background:rgba(8,12,7,.5);border:1px solid rgba(201,168,76,.08);padding:16px;}
        .impact-val{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--gold);}
        .impact-lbl{font-size:.7rem;color:var(--text-muted);margin-top:4px;letter-spacing:.06em;text-transform:uppercase;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--cream);margin-bottom:20px;}
        .charity-list{display:flex;flex-direction:column;gap:10px;}
        .charity-option{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid rgba(201,168,76,.08);cursor:pointer;transition:all .2s;background:none;width:100%;text-align:left;}
        .charity-option:hover{border-color:rgba(201,168,76,.2);background:rgba(201,168,76,.03);}
        .charity-option.selected{border-color:rgba(61,186,110,.3);background:rgba(29,74,46,.1);}
        .charity-opt-icon{width:40px;height:40px;background:rgba(29,74,46,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
        .charity-opt-name{font-size:.9rem;font-weight:500;color:var(--cream);}
        .charity-opt-sub{font-size:.72rem;color:var(--text-muted);margin-top:2px;}
        .charity-opt-check{margin-left:auto;width:20px;height:20px;border-radius:50%;border:1px solid rgba(61,186,110,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .charity-option.selected .charity-opt-check{background:var(--green-bright);border-color:var(--green-bright);color:var(--dark);font-size:.7rem;}
        .ring-wrap{position:relative;width:80px;height:80px;}
        .ring-svg{transform:rotate(-90deg);}
        .ring-track{fill:none;stroke:rgba(255,255,255,.06);stroke-width:5;}
        .ring-fill{fill:none;stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset 1s ease;}
        .ring-label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .ring-val{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;line-height:1;}
        .ring-lbl-txt{font-size:.55rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.impact-tiles{grid-template-columns:1fr 1fr;}.pct-row{flex-direction:column;align-items:flex-start;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} />
        <main className="main">
          <div className="topbar"><span className="topbar-title">My Charity</span></div>
          <div className="content">
            <div className="charity-hero">
              <div style={{fontSize:'.65rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>Currently Supporting</div>
              <div className="charity-name-lg">{charityName||"St. Jude Children's Research Hospital"}</div>
              <p className="charity-desc">Your subscription contributes directly to this life-changing cause. Every month, a portion of your membership goes to the charity you support.</p>
              <div className="pct-row">
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div className="ring-wrap">
                    <svg className="ring-svg" width="80" height="80" viewBox="0 0 80 80">
                      <circle className="ring-track" cx="40" cy="40" r="35" />
                      <circle className="ring-fill" cx="40" cy="40" r="35" stroke="var(--green-bright)" strokeDasharray={`${2*Math.PI*35}`} strokeDashoffset={`${2*Math.PI*35*(1-charityPct/100)}`} />
                    </svg>
                    <div className="ring-label"><span className="ring-val" style={{color:'var(--green-bright)'}}>{charityPct}%</span><span className="ring-lbl-txt">Given</span></div>
                  </div>
                  <div><div className="pct-display">{charityPct}%</div><div className="pct-label">of subscription</div></div>
                </div>
                <div className="pct-slider-wrap">
                  <div style={{fontSize:'.7rem',color:'var(--text-muted)',marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase'}}>Adjust contribution (min 10%)</div>
                  <input className="pct-slider" type="range" min={10} max={50} value={charityPct} onChange={e => handlePctChange(parseInt(e.target.value))} />
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.65rem',color:'var(--text-muted)',marginTop:4}}><span>10%</span><span>50%</span></div>
                </div>
              </div>
              <div className="impact-tiles">
                <div className="impact-tile"><div className="impact-val">£{perMonth}</div><div className="impact-lbl">Per month</div></div>
                <div className="impact-tile"><div className="impact-val">£{totalDonated.toLocaleString()}</div><div className="impact-lbl">Charity pool total</div></div>
                <div className="impact-tile"><div className="impact-val">{monthsSince(memberSince)} mo</div><div className="impact-lbl">Contributing</div></div>
              </div>
            </div>
            <div className="card">
              <div className="section-eyebrow">Charity Directory</div>
              <div className="section-title">Change Charity</div>
              <div className="charity-list">
                {CHARITY_LIST.map((c,i) => {
                  const isSel = charityName?.toLowerCase().includes(c.name.split("'")[0].trim().toLowerCase()) || (i===0&&!charityName)
                  return (
                    <button key={i} className={`charity-option ${isSel?'selected':''}`}>
                      <div className="charity-opt-icon">{c.icon}</div>
                      <div style={{flex:1,textAlign:'left'}}><div className="charity-opt-name">{c.name}</div><div className="charity-opt-sub">{c.sub}</div></div>
                      <div className="charity-opt-check">{isSel&&'✓'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
