'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import NavBar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

// ─── Supabase Client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface Score {
  id: string
  value: number
  date: string
}

interface DrawEntry {
  id: string
  month: string
  numbers: number[]
  status: 'pending' | 'matched3' | 'matched4' | 'matched5' | 'no-match'
  prize?: string
  drawStatus: string
}

interface UserProfile {
  id: string
  name: string
  plan: string
  charity_name: string
  charity_pct: number
  total_donated: number
  member_since: string
  next_renewal: string
  payment_method: string
  subscription_status: string
}

interface WinningsData {
  total: number
  prizes_won: number
  draws_entered: number
  win_rate: number
  prize_history: { month: string; match: string; amount: string; status: 'paid' | 'pending-pay' }[]
}

interface ActivityItem {
  icon: string
  cls: string
  text: string
  time: string
}

// Helper functions
const matchTypeToStatus = (matchType: number): DrawEntry['status'] => {
  if (matchType >= 5) return 'matched5'
  if (matchType === 4) return 'matched4'
  if (matchType === 3) return 'matched3'
  return 'no-match'
}

const matchTypeToLabel = (matchType: number): string => {
  if (matchType >= 5) return 'Jackpot Winner'
  if (matchType === 4) return '4 Number Match'
  if (matchType === 3) return '3 Number Match'
  return 'No Match'
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [winningsData, setWinningsData] = useState<WinningsData>({
    total: 0, prizes_won: 0, draws_entered: 0, win_rate: 0, prize_history: [],
  })
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [countdown, setCountdown] = useState<{ days: string; hours: string; mins: string }>({ days: '00', hours: '00', mins: '00' })
  const [nextDraw, setNextDraw] = useState<{ month: string; date: string } | null>(null)
  const [charityPct, setCharityPct] = useState<number>(15)
  const [appUserId, setAppUserId] = useState<string | null>(null)

  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useEffect(() => { fetchAllData() }, [])

  useEffect(() => {
    if (!nextDraw?.date) return
    const tick = () => {
      const diff = new Date(nextDraw.date).getTime() - Date.now()
      if (diff <= 0) { setCountdown({ days: '00', hours: '00', mins: '00' }); return }
      setCountdown({
        days: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        mins: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      })
    }
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [nextDraw?.date])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: appUser, error: userErr } = await supabase
        .from('users')
        .select('id, name, email, subscription_status, charity_id, charity_percentage')
        .eq('email', authUser.email)
        .single()

      if (userErr || !appUser) { setLoading(false); return }

      const userId: string = appUser.id
      setAppUserId(userId)

      let charityName = "St. Jude Children's Research Hospital"
      let charityTotalDonated = 0
      if (appUser.charity_id) {
        const { data: charity } = await supabase
          .from('charities')
          .select('name, total_donations')
          .eq('id', appUser.charity_id)
          .single()
        if (charity) {
          charityName = charity.name
          charityTotalDonated = parseFloat(charity.total_donations) || 0
        }
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const planLabel = sub?.plan === 'yearly' ? 'Pro Yearly' : 'Pro Monthly'

      setUserProfile({
        id: userId,
        name: appUser.name || authUser.email?.split('@')[0] || 'Member',
        plan: planLabel,
        charity_name: charityName,
        charity_pct: appUser.charity_percentage || 10,
        total_donated: charityTotalDonated,
        member_since: sub?.start_date || '',
        next_renewal: sub?.end_date || '',
        payment_method: 'Card on file',
        subscription_status: appUser.subscription_status || 'active',
      })
      setCharityPct(appUser.charity_percentage || 10)

      const { data: scoresData } = await supabase
        .from('scores')
        .select('id, score, played_at')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(5)

      if (scoresData) {
        setScores(scoresData.map((s: any) => ({
          id: s.id,
          value: s.score,
          date: s.played_at,
        })))
      }

      const { data: allDraws } = await supabase
        .from('draws')
        .select('id, month, numbers, type, status')
        .order('month', { ascending: false })

      const { data: myWinners } = await supabase
        .from('winners')
        .select('id, draw_id, match_type, prize_amount, status')
        .eq('user_id', userId)

      const draftDraw = allDraws?.find((d: any) => d.status === 'draft')
      if (draftDraw) {
        const parts = draftDraw.month.split(' ')
        let endOfMonth = ''
        if (parts.length === 2) {
          const d = new Date(`${parts[0]} 1, ${parts[1]}`)
          d.setMonth(d.getMonth() + 1)
          d.setDate(0)
          endOfMonth = d.toISOString()
        }
        setNextDraw({ month: draftDraw.month, date: endOfMonth })
      }

      if (myWinners) {
        const total = myWinners.reduce((s: number, w: any) => s + (parseFloat(w.prize_amount) || 0), 0)
        const publishedCount = allDraws ? allDraws.filter((d: any) => d.status === 'published').length : 0
        setWinningsData({
          total,
          prizes_won: myWinners.length,
          draws_entered: publishedCount,
          win_rate: publishedCount > 0 ? Math.round((myWinners.length / publishedCount) * 100) : 0,
          prize_history: myWinners.map((w: any) => {
            const draw = allDraws?.find((d: any) => d.id === w.draw_id)
            return {
              month: draw?.month || '—',
              match: matchTypeToLabel(w.match_type),
              amount: `£${parseFloat(w.prize_amount || 0).toFixed(2)}`,
              status: w.status === 'paid' ? 'paid' as const : 'pending-pay' as const,
            }
          }),
        })
      }

      const feed: ActivityItem[] = []
      if (scoresData && scoresData.length > 0) {
        const latest = scoresData[0]
        feed.push({
          icon: '⛳', cls: 'green',
          text: `New score entered — ${latest.score} pts Stableford`,
          time: new Date(latest.played_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        })
      }
      if (myWinners && myWinners.length > 0) {
        const latestWin = myWinners[0]
        const winDraw = allDraws?.find((d: any) => d.id === latestWin.draw_id)
        feed.push({
          icon: '🏆', cls: 'gold',
          text: `${winDraw?.month || 'Draw'} — ${matchTypeToLabel(latestWin.match_type)}${latestWin.prize_amount ? ` · £${parseFloat(latestWin.prize_amount).toFixed(2)} won` : ''}`,
          time: '',
        })
      }
      if (sub) {
        feed.push({
          icon: '◉', cls: 'blue',
          text: `Subscription active — ${planLabel}`,
          time: sub.start_date ? new Date(sub.start_date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        })
      }
      if (appUser.charity_id) {
        feed.push({
          icon: '💚', cls: 'green',
          text: `Supporting ${charityName} — ${appUser.charity_percentage}% of subscription`,
          time: '',
        })
      }
      setActivityFeed(feed)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const avg = scores.length > 0 ? (scores.reduce((s, x) => s + x.value, 0) / scores.length).toFixed(1) : '—'
  const best = scores.length > 0 ? Math.max(...scores.map(s => s.value)) : 0
  const totalDonated = userProfile?.total_donated || 0

  return (
    <>
      <NavBar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --gold: #C9A84C; --gold-light: #F0D080; --gold-dim: #8B6914;
          --green: #1A4A2E; --green-mid: #2D6A44; --green-bright: #3DBA6E;
          --cream: #FAF6EE; --dark: #080C07; --dark2: #0E1510; --dark3: #111A12;
          --text-muted: #7A8A79; --border: rgba(201,168,76,0.1); --sidebar-w: 260px;
        }
        html { cursor: none; }
        body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--cream); overflow-x: hidden; }
        .cursor-ring { position: fixed; width: 40px; height: 40px; border: 1.5px solid var(--gold); border-radius: 50%; pointer-events: none; z-index: 9999; transition: transform 0.12s ease; mix-blend-mode: difference; }
        .cursor-dot { position: fixed; width: 8px; height: 8px; background: var(--gold); border-radius: 50%; pointer-events: none; z-index: 10000; transition: transform 0.05s linear; }
        .noise { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .dash-wrap { display: flex; min-height: 100vh; opacity: 0; transition: opacity 0.6s ease; }
        .dash-wrap.loaded { opacity: 1; }
        .main { flex: 1; margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; margin-top: 64px; }
        .topbar { height: 64px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; background: rgba(8,12,7,0.6); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 40; }
        .topbar-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--cream); }
        .content { flex: 1; padding: 32px; }
        .loading-overlay { display: flex; align-items: center; justify-content: center; min-height: 300px; }
        .loading-spinner { width: 40px; height: 40px; border: 2px solid rgba(201,168,76,0.1); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .card { background: var(--dark2); border: 1px solid var(--border); padding: 28px; position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); margin-bottom: 24px; }
        .stat-card { background: var(--dark2); padding: 24px 28px; position: relative; overflow: hidden; transition: background 0.2s; }
        .stat-card:hover { background: var(--dark3); }
        .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); transform: scaleX(0); transition: transform 0.3s; }
        .stat-card:hover::after { transform: scaleX(1); }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; color: var(--gold); line-height: 1; }
        .stat-num.green { color: var(--green-bright); }
        .stat-label { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 6px; }
        .stat-trend { font-size: 0.75rem; color: var(--green-bright); margin-top: 6px; }
        .grid-3 { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px; }
        .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: var(--cream); }
        .section-eyebrow { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
        .score-row { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid rgba(201,168,76,0.06); }
        .score-row:last-child { border-bottom: none; }
        .score-rank { font-family: 'Playfair Display', serif; font-size: 0.75rem; color: var(--text-muted); width: 24px; text-align: center; }
        .score-ball { width: 44px; height: 44px; border-radius: 2px; background: rgba(29,74,46,0.3); border: 1px solid rgba(61,186,110,0.15); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 900; color: var(--cream); flex-shrink: 0; }
        .score-ball.best-score { background: rgba(61,186,110,0.15); border-color: rgba(61,186,110,0.4); color: var(--green-bright); }
        .score-info { flex: 1; }
        .score-course { font-size: 0.88rem; font-weight: 500; color: var(--cream); }
        .score-date { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
        .score-badge { font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border: 1px solid rgba(201,168,76,0.25); color: var(--gold); }
        .score-bars { display: flex; align-items: flex-end; gap: 8px; height: 80px; margin-top: 16px; }
        .score-bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .score-bar-fill { width: 100%; background: linear-gradient(180deg, var(--green-bright), var(--green-mid)); border-radius: 2px 2px 0 0; }
        .score-bar-fill.highlight { background: linear-gradient(180deg, var(--gold-light), var(--gold)); }
        .score-bar-val { font-size: 0.65rem; color: var(--text-muted); }
        .jackpot-banner { background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05)); border: 1px solid rgba(201,168,76,0.3); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
        .jackpot-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
        .jackpot-amount { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900; color: var(--gold); line-height: 1; }
        .jackpot-entry-num { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--cream); }
        .countdown-row { display: flex; gap: 12px; margin-top: 12px; }
        .countdown-block { flex: 1; background: rgba(8,12,7,0.6); border: 1px solid rgba(201,168,76,0.12); padding: 12px 8px; text-align: center; }
        .countdown-num { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--cream); line-height: 1; }
        .countdown-lbl { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 4px; }
        .ring-wrap { position: relative; width: 80px; height: 80px; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 5; }
        .ring-fill { fill: none; stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
        .ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-val { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; line-height: 1; }
        .ring-lbl-txt { font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
        .activity-feed { display: flex; flex-direction: column; }
        .activity-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(201,168,76,0.06); }
        .activity-item:last-child { border-bottom: none; }
        .activity-icon { width: 32px; height: 32px; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
        .activity-icon.green { background: rgba(29,74,46,0.3); }
        .activity-icon.gold { background: rgba(201,168,76,0.1); }
        .activity-icon.blue { background: rgba(59,130,246,0.1); }
        .activity-text { font-size: 0.85rem; color: var(--cream); line-height: 1.4; }
        .activity-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
        .btn-outline { background: none; border: 1px solid rgba(201,168,76,0.3); color: var(--gold); padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; cursor: none; transition: all 0.2s; }
        .btn-outline:hover { background: rgba(201,168,76,0.05); border-color: rgba(201,168,76,0.5); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .grid-3 { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .main { margin-left: 0 !important; } .content { padding: 20px 16px; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />

      <div className={`dash-wrap ${isLoaded ? 'loaded' : ''}`}>
        <Sidebar userName={userProfile?.name} plan={userProfile?.plan} />

        <main className="main">
          <div className="topbar">
            <span className="topbar-title">Overview</span>
          </div>

          <div className="content">
            {loading ? (
              <div className="loading-overlay"><div className="loading-spinner" /></div>
            ) : (
              <>
                {/* Stats */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Average Score</div>
                    <div className="stat-num">{avg}</div>
                    <div className="stat-trend">pts Stableford</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Best Score</div>
                    <div className="stat-num green">{best || '—'}</div>
                    <div className="stat-trend">↑ Personal best</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Draws Entered</div>
                    <div className="stat-num">{winningsData.draws_entered}</div>
                    <div className="stat-trend">Published draws</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Charity Pool</div>
                    <div className="stat-num green">£{totalDonated.toFixed(0)}</div>
                    <div className="stat-trend">↑ Total contributions</div>
                  </div>
                </div>

                <div className="grid-3">
                  {/* Scores card */}
                  <div className="card">
                    <div style={{ position: 'absolute', top: 24, right: 24, fontSize: '2rem', opacity: 0.12 }}>⛳</div>
                    <div className="section-eyebrow">Performance</div>
                    <div className="section-head">
                      <div className="section-title">Your Last 5 Scores</div>
                      <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.72rem' }} onClick={() => router.push('/dashboard/scores')}>View All</button>
                    </div>
                    {scores.length > 0 ? (
                      <>
                        <div className="score-bars" style={{ marginBottom: 16 }}>
                          {scores.map(s => (
                            <div key={s.id} className="score-bar-item">
                              <div className={`score-bar-fill ${s.value === best ? 'highlight' : ''}`} style={{ height: `${(s.value / 45) * 100}%` }} />
                              <span className="score-bar-val">{s.value}</span>
                            </div>
                          ))}
                        </div>
                        {scores.slice(0, 3).map((s, i) => (
                          <div key={s.id} className="score-row">
                            <span className="score-rank">#{i + 1}</span>
                            <div className={`score-ball ${s.value === best ? 'best-score' : ''}`}>{s.value}</div>
                            <div className="score-info">
                              <div className="score-course">{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              <div className="score-date">{s.value} pts Stableford</div>
                            </div>
                            {s.value === best && <span className="score-badge">Best</span>}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No scores yet.{' '}
                        <button onClick={() => router.push('/dashboard/scores')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
                          Add your first score.
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Next Draw */}
                    <div className="card" style={{ flex: 'none' }}>
                      <div className="section-eyebrow">Prize Draw</div>
                      <div className="section-title" style={{ marginBottom: 8 }}>Next Draw</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>{nextDraw?.month || 'Coming soon'}</div>
                      <div className="jackpot-banner" style={{ marginBottom: 0 }}>
                        <div>
                          <div className="jackpot-label">Jackpot Pool</div>
                          <div className="jackpot-amount">£5,000</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="jackpot-label" style={{ textAlign: 'right' }}>Draws</div>
                          <div className="jackpot-entry-num">{winningsData.draws_entered}</div>
                        </div>
                      </div>
                      <div className="countdown-row">
                        {[{ n: countdown.days, l: 'Days' }, { n: countdown.hours, l: 'Hours' }, { n: countdown.mins, l: 'Mins' }].map(({ n, l }) => (
                          <div key={l} className="countdown-block">
                            <div className="countdown-num">{n}</div>
                            <div className="countdown-lbl">{l}</div>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn-outline"
                        style={{ width: '100%', marginTop: 12, justifyContent: 'center', display: 'flex' }}
                        onClick={() => router.push('/dashboard/draws')}
                      >
                        View All Draws →
                      </button>
                    </div>

                    {/* Charity ring */}
                    <div className="card" style={{ flex: 1 }}>
                      <div className="section-eyebrow">This Month's Impact</div>
                      <div className="section-title" style={{ marginBottom: 16 }}>{userProfile?.charity_name || "St. Jude's"}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className="ring-wrap">
                          <svg className="ring-svg" width="80" height="80" viewBox="0 0 80 80">
                            <circle className="ring-track" cx="40" cy="40" r="35" />
                            <circle className="ring-fill" cx="40" cy="40" r="35" stroke="var(--green-bright)"
                              strokeDasharray={`${2 * Math.PI * 35}`}
                              strokeDashoffset={`${2 * Math.PI * 35 * (1 - charityPct / 100)}`} />
                          </svg>
                          <div className="ring-label">
                            <span className="ring-val" style={{ color: 'var(--green-bright)' }}>{charityPct}%</span>
                            <span className="ring-lbl-txt">Given</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total donated</div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900, color: 'var(--green-bright)', lineHeight: 1.2 }}>£{totalDonated.toFixed(2)}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Charity pool total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="card">
                  <div className="section-eyebrow">Timeline</div>
                  <div className="section-head"><div className="section-title">Recent Activity</div></div>
                  <div className="activity-feed">
                    {activityFeed.length > 0 ? activityFeed.map((a, i) => (
                      <div key={i} className="activity-item">
                        <div className={`activity-icon ${a.cls}`}>{a.icon}</div>
                        <div>
                          <div className="activity-text">{a.text}</div>
                          {a.time && <div className="activity-time">{a.time}</div>}
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}