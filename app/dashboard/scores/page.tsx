'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function Scores() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [scoreMsg, setScoreMsg] = useState('')
  const [userName, setUserName] = useState('Member')
  const [appUserId, setAppUserId] = useState<string|null>(null)
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
      if (appUser) { setUserName(appUser.name || user.email?.split('@')[0] || 'Member'); setAppUserId(appUser.id) }
      const { data: sc } = await supabase.from('scores').select('id,score,played_at').eq('user_id', appUser?.id).order('played_at',{ascending:false}).limit(5)
      setScores(sc || [])
      setLoading(false)
    }
    load()
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const avg = scores.length > 0 ? (scores.reduce((s,x) => s + x.score, 0) / scores.length).toFixed(1) : '—'
  const best = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0
  const trend = scores.length >= 2 ? scores[0].score - scores[scores.length-1].score : 0

  const handleAdd = async () => {
    const val = parseInt(newScore)
    if (!val || val < 1 || val > 45) { setScoreMsg('Score must be between 1 and 45'); return }
    if (!newDate) { setScoreMsg('Please select a date'); return }
    if (!appUserId) return
    const { data, error } = await supabase.from('scores').insert([{ user_id: appUserId, score: val, played_at: newDate }]).select('id,score,played_at').single()
    if (error) { setScoreMsg('Error saving score'); return }
    setScores(prev => [data, ...prev].slice(0, 5))
    setNewScore(''); setNewDate('')
    setScoreMsg('✓ Score added successfully!')
    setTimeout(() => setScoreMsg(''), 3000)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id)
    setScores(prev => prev.filter(s => s.id !== id))
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
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-bottom:24px;}
        .stat-card{background:var(--dark2);padding:24px 28px;position:relative;overflow:hidden;transition:background .2s;}
        .stat-card:hover{background:var(--dark3);}
        .stat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform:scaleX(0);transition:transform .3s;}
        .stat-card:hover::after{transform:scaleX(1);}
        .stat-num{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:var(--gold);line-height:1;}
        .stat-num.green{color:var(--green-bright);}
        .stat-label{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-top:6px;}
        .stat-trend{font-size:.75rem;color:var(--green-bright);margin-top:6px;}
        .stat-trend.down{color:#FCA5A5;}
        .card{background:var(--dark2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;margin-bottom:24px;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .section-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
        .section-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--cream);}
        .score-row{display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid rgba(201,168,76,.06);}
        .score-row:last-child{border-bottom:none;}
        .score-rank{font-family:'Playfair Display',serif;font-size:.75rem;color:var(--text-muted);width:24px;text-align:center;}
        .score-ball{width:44px;height:44px;border-radius:2px;background:rgba(29,74,46,.3);border:1px solid rgba(61,186,110,.15);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:900;color:var(--cream);flex-shrink:0;}
        .score-ball.best{background:rgba(61,186,110,.15);border-color:rgba(61,186,110,.4);color:var(--green-bright);}
        .score-info{flex:1;}
        .score-date{font-size:.88rem;font-weight:500;color:var(--cream);}
        .score-pts{font-size:.72rem;color:var(--text-muted);margin-top:2px;}
        .score-badge{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border:1px solid rgba(201,168,76,.25);color:var(--gold);}
        .score-delete{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.85rem;padding:4px 8px;transition:color .2s;border-radius:2px;}
        .score-delete:hover{color:#FCA5A5;background:rgba(239,68,68,.08);}
        .bar-visual{display:flex;align-items:flex-end;gap:12px;height:120px;margin-bottom:24px;}
        .bar-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;}
        .bar-fill{width:100%;border-radius:2px 2px 0 0;min-height:4px;}
        .bar-val{font-size:.75rem;color:var(--cream);font-family:'Playfair Display',serif;font-weight:700;}
        .bar-dt{font-size:.6rem;color:var(--text-muted);text-align:center;}
        .add-form{border:1px solid var(--border);background:var(--dark);padding:24px;margin-top:16px;}
        .form-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;}
        .field-grp{display:flex;flex-direction:column;gap:6px;}
        .field-lbl{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .field-inp{background:var(--dark2);border:1px solid rgba(201,168,76,.1);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.9rem;padding:10px 14px;outline:none;transition:border-color .2s;width:100%;}
        .field-inp:focus{border-color:rgba(201,168,76,.4);}
        .btn-add{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:transform .2s,box-shadow .2s;}
        .btn-add:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(201,168,76,.25);}
        .form-msg{font-size:.8rem;margin-top:10px;}
        .form-msg.success{color:var(--green-bright);}
        .form-msg.error{color:#FCA5A5;}
        @media(max-width:768px){.main{margin-left:0;}.stats-grid{grid-template-columns:repeat(2,1fr);}.content{padding:20px 16px;}.form-row{grid-template-columns:1fr;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" /><div ref={cursorDotRef} className="cursor-dot" /><div className="noise" />
      <NavBar />
      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userName} />
        <main className="main">
          <div className="topbar"><span className="topbar-title">My Scores</span></div>
          <div className="content">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Average Score</div><div className="stat-num">{avg}</div><div className="stat-trend">pts Stableford</div></div>
              <div className="stat-card"><div className="stat-label">Best Score</div><div className="stat-num green">{best||'—'}</div><div className="stat-trend">↑ Personal best</div></div>
              <div className="stat-card"><div className="stat-label">Scores Logged</div><div className="stat-num">{scores.length}/5</div><div className="stat-trend">Rolling window</div></div>
              <div className="stat-card"><div className="stat-label">Trend</div><div className={`stat-num ${trend>=0?'green':''}`}>{trend>=0?'+':''}{trend}</div><div className={`stat-trend ${trend<0?'down':''}`}>{trend>=0?'↑ Improving':'↓ Declining'}</div></div>
            </div>
            <div className="card">
              <div className="section-eyebrow">Score History</div>
              <div className="section-head">
                <div className="section-title">Your Last 5 Scores</div>
                <div style={{fontSize:'.75rem',color:'var(--text-muted)'}}>Stableford Format · Range 1–45</div>
              </div>
              {scores.length > 0 && (
                <div className="bar-visual">
                  {scores.map(s => (
                    <div key={s.id} className="bar-item">
                      <div className="bar-val">{s.score}</div>
                      <div className="bar-fill" style={{height:`${(s.score/45)*100}%`,background:s.score===best?'linear-gradient(180deg,var(--gold-light),var(--gold))':'linear-gradient(180deg,var(--green-bright),var(--green-mid))'}} />
                      <div className="bar-dt">{new Date(s.played_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                    </div>
                  ))}
                </div>
              )}
              {scores.length === 0 && !loading && <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>No scores yet. Add your first score below.</div>}
              {scores.map((s,i) => (
                <div key={s.id} className="score-row">
                  <span className="score-rank">#{i+1}</span>
                  <div className={`score-ball ${s.score===best?'best':''}`}>{s.score}</div>
                  <div className="score-info">
                    <div className="score-date">{new Date(s.played_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
                    <div className="score-pts">{s.score} pts Stableford</div>
                  </div>
                  {s.score===best && <span className="score-badge">Best</span>}
                  <button className="score-delete" onClick={() => handleDelete(s.id)}>✕</button>
                </div>
              ))}
              <div className="add-form">
                <div className="form-row">
                  <div className="field-grp"><label className="field-lbl">Score (1–45)</label><input className="field-inp" type="number" min={1} max={45} placeholder="e.g. 38" value={newScore} onChange={e => setNewScore(e.target.value)} /></div>
                  <div className="field-grp"><label className="field-lbl">Date Played</label><input className="field-inp" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                  <button className="btn-add" onClick={handleAdd}>Add Score →</button>
                </div>
                {scoreMsg && <div className={`form-msg ${scoreMsg.startsWith('✓')?'success':'error'}`}>{scoreMsg}</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
