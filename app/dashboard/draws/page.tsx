'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function Draws() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [draws, setDraws] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [myWinners, setMyWinners] = useState<any[]>([])
  const [userName, setUserName] = useState('Member')
  const [nextDraw, setNextDraw] = useState<any>(null)
  const [countdown, setCountdown] = useState({days:'00',hours:'00',mins:'00'})
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
      const { data: appUser } = await supabase.from('users').select('id,name').eq('email', user.email).single()
      if (appUser) setUserName(appUser.name || user.email?.split('@')[0] || 'Member')
      const [{ data: allDraws }, { data: sc }, { data: wn }] = await Promise.all([
        supabase.from('draws').select('*').order('month',{ascending:false}),
        supabase.from('scores').select('id,score,played_at').eq('user_id', appUser?.id).order('played_at',{ascending:false}).limit(5),
        supabase.from('winners').select('*').eq('user_id', appUser?.id),
      ])
      setScores(sc || [])
      setMyWinners(wn || [])
      const winnerByDraw: Record<string,any> = {}
      if (wn) wn.forEach((w:any) => { winnerByDraw[w.draw_id] = w })
      const mapped = (allDraws||[]).map((d:any) => {
        const w = winnerByDraw[d.id]
        let status = 'pending', prize = undefined
        if (d.status === 'published') { status = w ? `matched${w.match_type}` : 'no-match'; if (w) prize = `£${parseFloat(w.prize_amount).toFixed(2)}` }
        return { ...d, drawStatus: d.status, status, prize }
      })
      setDraws(mapped)
      const draft = (allDraws||[]).find((d:any) => d.status === 'draft')
      if (draft) {
        const parts = draft.month.split(' ')
        let endOfMonth = ''
        if (parts.length === 2) { const d = new Date(`${parts[0]} 1, ${parts[1]}`); d.setMonth(d.getMonth()+1); d.setDate(0); endOfMonth = d.toISOString() }
        setNextDraw({ month: draft.month, date: endOfMonth })
      }
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  useEffect(() => {
    if (!nextDraw?.date) return
    const tick = () => {
      const diff = new Date(nextDraw.date).getTime() - Date.now()
      if (diff <= 0) { setCountdown({days:'00',hours:'00',mins:'00'}); return }
      setCountdown({ days:String(Math.floor(diff/86400000)).padStart(2,'0'), hours:String(Math.floor((diff%86400000)/3600000)).padStart(2,'0'), mins:String(Math.floor((diff%3600000)/60000)).padStart(2,'0') })
    }
    tick(); const i = setInterval(tick, 30000); return () => clearInterval(i)
  }, [nextDraw?.date])

  const statusLabel: Record<string,{label:string;color:string}> = {
    pending:{label:'Pending',color:'rgba(201,168,76,.15)'},matched3:{label:'3 Match',color:'rgba(61,186,110,.15)'},
    matched4:{label:'4 Match',color:'rgba(61,186,110,.25)'},matched5:{label:'JACKPOT!',color:'rgba(201,168,76,.3)'},'no-match':{label:'No Match',color:'rgba(122,138,121,.15)'}
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
        .jackpot-banner{background:linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05));border:1px solid rgba(201,168,76,.3);padding:24px 32px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;}
        .jackpot-label{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .jackpot-amount{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:900;color:var(--gold);line-height:1;}
        .jackpot-sub{font-size:.78rem;color:var(--text-muted);margin-top:4px;}
        .countdown-row{display:flex;gap:12px;margin-top:12px;}
        .countdown-block{background:rgba(8,12,7,.6);border:1px solid rgba(201,168,76,.12);padding:12px 16px;text-align:center;min-width:60px;}
        .countdown-num{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:var(--cream);line-height:1;}
        .countdown-lbl{font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:4px;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--cream);}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .draw-card{background:var(--dark2);border:1px solid var(--border);padding:24px;margin-bottom:12px;position:relative;overflow:hidden;}
        .draw-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .draw-month{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;}
        .draw-status{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border:1px solid rgba(201,168,76,.25);}
        .draw-numbers{display:flex;gap:8px;margin-bottom:12px;}
        .draw-num{width:44px;height:44px;border-radius:50%;background:rgba(29,74,46,.2);border:1px solid rgba(61,186,110,.15);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1rem;font-weight:900;}
        .draw-num.matched{background:rgba(61,186,110,.2);border-color:rgba(61,186,110,.5);color:var(--green-bright);}
        .draw-prize{font-size:.85rem;color:var(--gold);}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
        .tier-card{background:var(--dark2);border:1px solid var(--border);padding:20px 24px;position:relative;overflow:hidden;}
        .tier-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .tier-label{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
        .tier-val{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;}
        .tier-sub{font-size:.78rem;color:var(--text-muted);margin-top:6px;}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.grid-2{grid-template-columns:1fr;}.jackpot-banner{flex-direction:column;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Prize Draws</span></div>
          <div className="content">
            <div className="jackpot-banner">
              <div>
                <div className="jackpot-label">{nextDraw?.month||'Upcoming Draw'} · Jackpot Pool</div>
                <div className="jackpot-amount">£5,000</div>
                <div className="jackpot-sub">Draw end of {nextDraw?.month||'—'}</div>
                <div className="countdown-row">
                  {[{n:countdown.days,l:'Days'},{n:countdown.hours,l:'Hours'},{n:countdown.mins,l:'Mins'}].map(({n,l}) => (
                    <div key={l} className="countdown-block"><div className="countdown-num">{n}</div><div className="countdown-lbl">{l}</div></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="jackpot-label" style={{textAlign:'right'}}>Your Numbers (Current Scores)</div>
                <div style={{display:'flex',gap:8,marginTop:6}}>
                  {scores.length > 0 ? scores.map((s:any) => (
                    <div key={s.id} style={{width:40,height:40,borderRadius:'50%',background:'rgba(29,74,46,.3)',border:'1px solid rgba(61,186,110,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Playfair Display,serif',fontSize:'.9rem',fontWeight:900}}>{s.score}</div>
                  )) : <div style={{fontSize:'.82rem',color:'var(--text-muted)'}}>No scores yet</div>}
                </div>
              </div>
            </div>
            <div className="grid-2">
              {[{tier:'5 Number Match',pct:'40%',desc:'Jackpot — rolls over if unclaimed',color:'var(--gold)'},{tier:'4 Number Match',pct:'35%',desc:'Split equally among winners',color:'var(--green-bright)'}].map(t => (
                <div key={t.tier} className="tier-card"><div className="tier-label">{t.tier}</div><div className="tier-val" style={{color:t.color}}>{t.pct} pool</div><div className="tier-sub">{t.desc}</div></div>
              ))}
            </div>
            <div className="card">
              <div className="section-eyebrow">Draw History</div>
              <div className="section-head"><div className="section-title">All Draws</div></div>
              {draws.length > 0 ? draws.map((draw:any) => {
                const badge = statusLabel[draw.status] || {label:'—',color:'transparent'}
                const matchCount = draw.status.startsWith('matched') ? parseInt(draw.status.replace('matched','')) : 0
                return (
                  <div key={draw.id} className="draw-card">
                    <div className="draw-header">
                      <div className="draw-month">{draw.month}</div>
                      <div className="draw-status" style={{background:badge.color,borderColor:badge.color,color:draw.status==='pending'?'var(--gold)':draw.status==='no-match'?'var(--text-muted)':'var(--green-bright)'}}>{badge.label}</div>
                    </div>
                    <div className="draw-numbers">
                      {(draw.numbers||[]).map((n:number,j:number) => <div key={j} className={`draw-num ${matchCount>0&&j<matchCount?'matched':''}`}>{n}</div>)}
                    </div>
                    {draw.prize && <div className="draw-prize">🏆 Prize won: {draw.prize}</div>}
                    {draw.status==='pending' && <div style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Draw result pending — end of {draw.month}</div>}
                  </div>
                )
              }) : <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>No draws found.</div>}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
