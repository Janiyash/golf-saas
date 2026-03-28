'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NavBar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function CharityDetail() {
  const router = useRouter()
  const params = useParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [charity, setCharity] = useState<any>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const h = (e: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${e.clientX - 20}px,${e.clientY - 20}px)`
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 4}px)`
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  useEffect(() => {
    const id = params?.id as string
    if (!id) return
    supabase.from('charities').select('*').eq('id', id).single().then(({ data }) => {
      setCharity(data || { name: 'Charity', description: 'Supporting great causes through golf.', total_donations: 0 })
    })
  }, [params?.id])

  const ICONS: Record<string, string> = { "St. Jude Hospital": '🏥', "Cancer Research UK": '🎗️', "British Heart Foundation": '❤️', "Alzheimer's Society": '🧠', RNLI: '⛵' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--gold-dim:#8B6914;--green:#1A4A2E;--green-mid:#2D6A44;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--text-muted:#7A8A79;}
        html{cursor:none;} body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);overflow-x:hidden;}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .page-wrap{opacity:0;transition:opacity .6s ease;} .page-wrap.loaded{opacity:1;}
        .back-btn{position:fixed;top:90px;left:40px;z-index:50;display:flex;align-items:center;gap:8px;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:rgba(201,168,76,.5);cursor:none;transition:color .2s;background:none;border:none;}
        .back-btn:hover{color:var(--gold);}
        .hero{padding:160px 80px 80px;background:radial-gradient(ellipse 70% 50% at 50% 30%,rgba(29,74,46,.3),transparent);}
        .hero-inner{max-width:800px;margin:0 auto;text-align:center;}
        .charity-icon-lg{width:100px;height:100px;background:linear-gradient(135deg,rgba(29,74,46,.5),rgba(29,74,46,.2));border:1px solid rgba(61,186,110,.2);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 32px;}
        .charity-name-lg{font-family:'Playfair Display',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:900;line-height:1.05;margin-bottom:16px;}
        .charity-desc-lg{color:var(--text-muted);font-size:1.05rem;font-weight:300;line-height:1.75;max-width:600px;margin:0 auto 40px;}
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(201,168,76,.08);margin:0 80px;}
        .stat-box{background:var(--dark2);padding:36px;text-align:center;}
        .stat-val{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:900;color:var(--gold);display:block;line-height:1;margin-bottom:6px;}
        .stat-lbl{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .section{padding:80px;}
        .section-title{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;margin-bottom:32px;}
        .impact-list{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .impact-item{background:var(--dark2);border:1px solid rgba(201,168,76,.08);padding:28px;display:flex;align-items:flex-start;gap:16px;}
        .impact-item-icon{font-size:1.5rem;flex-shrink:0;}
        .impact-item-title{font-size:.95rem;font-weight:500;color:var(--cream);margin-bottom:4px;}
        .impact-item-desc{font-size:.82rem;color:var(--text-muted);line-height:1.6;}
        .cta-row{display:flex;gap:16px;justify-content:center;padding:60px 80px;border-top:1px solid rgba(201,168,76,.08);}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:16px 36px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;cursor:none;transition:transform .2s,box-shadow .3s;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 20px 60px rgba(201,168,76,.35);}
        .btn-outline{background:none;border:1px solid rgba(201,168,76,.3);color:var(--gold);padding:16px 36px;font-family:'DM Sans',sans-serif;font-size:.9rem;letter-spacing:.06em;text-transform:uppercase;cursor:none;transition:all .2s;}
        .btn-outline:hover{background:rgba(201,168,76,.05);border-color:rgba(201,168,76,.5);}
        @media(max-width:1024px){.hero,.section{padding:120px 40px 60px;}.stats-row,.cta-row{margin:0 40px;}.impact-list{grid-template-columns:1fr;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <NavBar />
      <button className="back-btn" onClick={() => router.push('/charities')}>← All Charities</button>
      <div className={`page-wrap${isLoaded ? ' loaded' : ''}`}>
        {charity ? (
          <>
            <section className="hero">
              <div className="hero-inner">
                <div className="charity-icon-lg">{ICONS[charity.name] || '💚'}</div>
                <h1 className="charity-name-lg">{charity.name}</h1>
                <p className="charity-desc-lg">{charity.description}</p>
              </div>
            </section>
            <div className="stats-row">
              {[
                { val: `£${Number(charity.total_donations || 0).toLocaleString()}`, lbl: 'Total Raised via GolfCharity' },
                { val: '12K+', lbl: 'Contributing Players' },
                { val: '100%', lbl: 'Transparent Donations' },
              ].map((s, i) => <div key={i} className="stat-box"><span className="stat-val">{s.val}</span><span className="stat-lbl">{s.lbl}</span></div>)}
            </div>
            <section className="section">
              <div className="section-title">Why <span style={{ color: 'var(--gold)' }}>This Matters</span></div>
              <div className="impact-list">
                {[
                  { icon: '🎯', t: 'Direct Impact', d: 'Every penny donated reaches the charity — zero admin fees taken from donations.' },
                  { icon: '📊', t: 'Transparent Reporting', d: 'Monthly impact reports show exactly how funds are being used.' },
                  { icon: '💚', t: 'Player Driven', d: 'Our community chose this charity. Your game, your cause.' },
                  { icon: '🏆', t: 'Prize Link', d: 'A portion of every prize pool goes directly to this charity.' },
                ].map((item, i) => (
                  <div key={i} className="impact-item">
                    <div className="impact-item-icon">{item.icon}</div>
                    <div><div className="impact-item-title">{item.t}</div><div className="impact-item-desc">{item.d}</div></div>
                  </div>
                ))}
              </div>
            </section>
            <div className="cta-row">
              <button className="btn-primary" onClick={() => router.push('/signup')}>Support This Charity</button>
              <button className="btn-outline" onClick={() => router.push('/charities')}>View All Charities</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
            Loading charity details...
          </div>
        )}
      </div>
    </>
  )
}
