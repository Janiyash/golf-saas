'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { matchTypeToLabel } from '@/utils/helpers'

export default function Winnings() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [winners, setWinners] = useState<any[]>([])
  const [allDraws, setAllDraws] = useState<any[]>([])
  const [userName, setUserName] = useState('Member')
  const [totalDraws, setTotalDraws] = useState(0)
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
      const [{ data: wn }, { data: draws }] = await Promise.all([
        supabase.from('winners').select('*').eq('user_id', appUser?.id).order('created_at',{ascending:false}),
        supabase.from('draws').select('id,month,status'),
      ])
      setWinners(wn||[]); setAllDraws(draws||[])
      setTotalDraws((draws||[]).filter((d:any) => d.status==='published').length)
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const total = winners.reduce((s,w) => s + (parseFloat(w.prize_amount)||0), 0)
  const winRate = totalDraws > 0 ? Math.round((winners.length/totalDraws)*100) : 0

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
        .winnings-total{background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04));border:1px solid rgba(201,168,76,.25);padding:32px;margin-bottom:24px;display:flex;align-items:center;gap:32px;flex-wrap:wrap;}
        .win-total-label{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;}
        .win-total-val{font-family:'Playfair Display',serif;font-size:3.5rem;font-weight:900;color:var(--gold);line-height:1;}
        .win-divider{width:1px;height:60px;background:rgba(201,168,76,.2);}
        .win-stat-val{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--cream);}
        .win-stat-lbl{font-size:.7rem;color:var(--text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:.08em;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--cream);}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .win-row{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid rgba(201,168,76,.06);}
        .win-row:last-child{border-bottom:none;}
        .win-month{font-size:.88rem;font-weight:500;color:var(--cream);}
        .win-match{font-size:.72rem;color:var(--text-muted);margin-top:2px;}
        .win-amount{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--green-bright);}
        .win-status{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border:1px solid;}
        .win-status.paid{border-color:rgba(61,186,110,.3);color:var(--green-bright);}
        .win-status.pending{border-color:rgba(201,168,76,.3);color:var(--gold);}
        .step-row{display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;}
        .step-row:last-child{margin-bottom:0;}
        .step-n{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:rgba(201,168,76,.15);line-height:1;flex-shrink:0;width:40px;}
        .step-t{font-size:.9rem;font-weight:500;color:var(--cream);margin-bottom:4px;}
        .step-d{font-size:.82rem;color:var(--text-muted);line-height:1.6;}
        @media(max-width:768px){.main{margin-left:0;}.content{padding:20px 16px;}.winnings-total{flex-direction:column;gap:16px;}.win-divider{width:60px;height:1px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} />
        <main className="main">
          <div className="topbar"><span className="topbar-title">Winnings</span></div>
          <div className="content">
            <div className="winnings-total">
              <div><div className="win-total-label">Total Winnings</div><div className="win-total-val">£{total.toFixed(2)}</div></div>
              <div className="win-divider" />
              <div><div className="win-stat-val">{winners.length}</div><div className="win-stat-lbl">{winners.length===1?'Prize won':'Prizes won'}</div></div>
              <div className="win-divider" />
              <div><div className="win-stat-val">{totalDraws}</div><div className="win-stat-lbl">Draws entered</div></div>
              <div className="win-divider" />
              <div><div className="win-stat-val">{winRate}%</div><div className="win-stat-lbl">Win rate</div></div>
            </div>
            <div className="card">
              <div className="section-eyebrow">Prize History</div>
              <div className="section-head"><div className="section-title">Your Winnings</div></div>
              {winners.map((w,i) => {
                const draw = allDraws.find((d:any) => d.id === w.draw_id)
                return (
                  <div key={i} className="win-row">
                    <div><div className="win-month">{draw?.month||'—'}</div><div className="win-match">{matchTypeToLabel(w.match_type)}</div></div>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                      <div className="win-amount">£{parseFloat(w.prize_amount||0).toFixed(2)}</div>
                      <div className={`win-status ${w.status==='paid'?'paid':'pending'}`}>{w.status==='paid'?'Paid':'Pending'}</div>
                    </div>
                  </div>
                )
              })}
              <div style={{padding:'24px 0',textAlign:'center',color:'var(--text-muted)',fontSize:'.85rem',borderTop:winners.length>0?'1px solid rgba(201,168,76,.06)':'none'}}>
                {winners.length===0?'No winnings yet. Keep playing!':'Keep playing — the next draw is coming soon.'}
              </div>
            </div>
            <div className="card" style={{borderColor:'rgba(201,168,76,.2)'}}>
              <div className="section-eyebrow">Winner Verification</div>
              <div className="section-head"><div className="section-title">How Verification Works</div></div>
              {[{n:'01',t:'Win Notification',d:'You receive an email when your numbers match the draw.'},{n:'02',t:'Upload Proof',d:'Submit a screenshot of your scores from the platform.'},{n:'03',t:'Admin Review',d:'Our team reviews your submission within 48 hours.'},{n:'04',t:'Payment',d:'Once verified, payment is processed to your registered account.'}].map(s => (
                <div key={s.n} className="step-row"><div className="step-n">{s.n}</div><div><div className="step-t">{s.t}</div><div className="step-d">{s.d}</div></div></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
