'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function CharitiesPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  const ICONS: Record<string, string> = {
    "St. Jude Hospital": '🏥', "Cancer Research UK": '🎗️',
    "British Heart Foundation": '❤️', "Alzheimer's Society": '🧠', RNLI: '⛵',
  }

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
    supabase.from('charities').select('*').then(({ data }) => {
      setCharities(data || [])
      setLoading(false)
    })
  }, [])

  const STATIC = [
    { name: "St. Jude Children's Hospital", desc: 'Pioneering research and treatment for childhood cancer and life-threatening diseases. Families never receive a bill.', total_donations: 8420 },
    { name: 'Cancer Research UK', desc: 'The world\'s leading cancer research organisation, funding scientists, doctors and nurses for over 100 years.', total_donations: 6710 },
    { name: "Alzheimer's Society", desc: 'The UK\'s leading dementia charity, providing support and funding research into care, cure and prevention.', total_donations: 5180 },
    { name: 'British Heart Foundation', desc: 'Funding cutting-edge research into heart and circulatory diseases that affect millions worldwide.', total_donations: 4340 },
    { name: 'RNLI', desc: 'Saving lives at sea for 200 years. Volunteer crews operating 24/7 around the coasts of the UK and Ireland.', total_donations: 3920 },
  ]
  const display = charities.length > 0 ? charities : STATIC

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--gold-dim:#8B6914;--green:#1A4A2E;--green-mid:#2D6A44;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--text-muted:#7A8A79;}
        html{cursor:none;scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);overflow-x:hidden;}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .page-wrap{opacity:0;transition:opacity .6s ease;}
        .page-wrap.loaded{opacity:1;}
        .hero{padding:160px 80px 100px;text-align:center;position:relative;background:radial-gradient(ellipse 70% 50% at 50% 30%,rgba(29,74,46,.3),transparent);}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(201,168,76,.3);padding:6px 16px;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:28px;}
        .eyebrow-dot{width:6px;height:6px;background:var(--green-bright);border-radius:50%;animation:pulse 2s infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .hero-title{font-family:'Playfair Display',serif;font-size:clamp(3rem,6vw,5rem);font-weight:900;line-height:1.05;margin-bottom:20px;}
        .hero-title span{color:var(--green-bright);}
        .hero-sub{color:var(--text-muted);font-size:1.1rem;font-weight:300;max-width:560px;margin:0 auto 48px;line-height:1.7;}
        .impact-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(201,168,76,.08);border-top:1px solid rgba(201,168,76,.1);border-bottom:1px solid rgba(201,168,76,.1);}
        .impact-stat{background:var(--dark);padding:36px;text-align:center;}
        .impact-val{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:900;color:var(--gold);line-height:1;display:block;margin-bottom:6px;}
        .impact-lbl{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .section{padding:100px 80px;}
        .section-eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:12px;}
        .section-eyebrow::after{content:'';flex:1;max-width:40px;height:1px;background:var(--gold);opacity:.4;}
        .section-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,3.5vw,3rem);font-weight:900;line-height:1.1;margin-bottom:60px;}
        .charities-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;}
        .charity-card{background:var(--dark2);border:1px solid rgba(201,168,76,.08);padding:36px;position:relative;overflow:hidden;cursor:pointer;transition:all .3s;}
        .charity-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(61,186,110,.4),transparent);transform:scaleX(0);transition:transform .4s;}
        .charity-card:hover{border-color:rgba(201,168,76,.25);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.3);}
        .charity-card:hover::before{transform:scaleX(1);}
        .charity-icon{width:60px;height:60px;background:linear-gradient(135deg,rgba(29,74,46,.5),rgba(29,74,46,.2));border:1px solid rgba(61,186,110,.2);border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px;}
        .charity-name{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;margin-bottom:10px;color:var(--cream);}
        .charity-desc{font-size:.88rem;color:var(--text-muted);line-height:1.7;font-weight:300;margin-bottom:24px;}
        .charity-raised{display:flex;align-items:center;justify-content:space-between;padding-top:20px;border-top:1px solid rgba(201,168,76,.06);}
        .raised-label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);}
        .raised-val{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:var(--green-bright);}
        .charity-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);font-family:'DM Sans',sans-serif;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;padding:9px 18px;cursor:pointer;transition:all .2s;margin-top:16px;}
        .charity-btn:hover{background:rgba(201,168,76,.08);border-color:rgba(201,168,76,.4);}
        .cta-section{padding:120px 80px;text-align:center;position:relative;}
        .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(29,74,46,.4),transparent);}
        .cta-border{position:absolute;top:0;left:80px;right:80px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
        .cta-title{font-family:'Playfair Display',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:900;line-height:1.05;margin-bottom:20px;position:relative;z-index:2;}
        .cta-title span{color:var(--gold);}
        .cta-sub{color:var(--text-muted);font-size:1rem;font-weight:300;margin-bottom:40px;position:relative;z-index:2;}
        .btn-primary{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:16px 36px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;cursor:none;transition:transform .2s,box-shadow .3s;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));position:relative;z-index:2;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 20px 60px rgba(201,168,76,.35);}
        .footer{background:var(--dark2);border-top:1px solid rgba(201,168,76,.08);padding:40px 80px;text-align:center;}
        .footer-copy{font-size:.8rem;color:rgba(122,138,121,.5);}
        @media(max-width:1024px){.hero,.section{padding:120px 40px 80px;}.charities-grid{grid-template-columns:1fr;}.impact-row{grid-template-columns:1fr;}.cta-section{padding:80px 40px;}}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <NavBar />
      <div className={`page-wrap${isLoaded ? ' loaded' : ''}`}>
        <section className="hero">
          <div className="hero-eyebrow"><span className="eyebrow-dot" />Real Impact · 2026</div>
          <h1 className="hero-title">Golf for <span>Good.</span></h1>
          <p className="hero-sub">Every subscription, every score, every draw — a portion goes directly to the charity you choose. No admin fees. 100% transparent.</p>
        </section>

        <div className="impact-row">
          {[{ val: '£340K', lbl: 'Total Donated' }, { val: '5', lbl: 'Partner Charities' }, { val: '12K+', lbl: 'Contributing Players' }].map((s, i) => (
            <div key={i} className="impact-stat"><span className="impact-val">{s.val}</span><span className="impact-lbl">{s.lbl}</span></div>
          ))}
        </div>

        <section className="section">
          <div className="section-eyebrow">Our Partners</div>
          <h2 className="section-title">Choose your<br /><span style={{ color: 'var(--gold)' }}>cause.</span></h2>
          <div className="charities-grid">
            {display.map((c: any, i: number) => {
              const icon = ICONS[c.name] || '💚'
              const raised = c.total_donations ? `£${Number(c.total_donations).toLocaleString()}` : '£0'
              return (
                <div key={i} className="charity-card" onClick={() => router.push(`/charities/${c.id || i}`)}>
                  <div className="charity-icon">{icon}</div>
                  <div className="charity-name">{c.name}</div>
                  <p className="charity-desc">{c.description || c.desc}</p>
                  <div className="charity-raised">
                    <div><div className="raised-label">Total Raised</div><div className="raised-val">{raised}</div></div>
                    <button className="charity-btn">Learn More →</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-bg" /><div className="cta-border" />
          <h2 className="cta-title">Start playing.<br /><span>Start giving.</span></h2>
          <p className="cta-sub">Join 12,400+ golfers making a difference every round.</p>
          <button className="btn-primary" onClick={() => router.push('/signup')}>Join Free Today</button>
        </section>

        <footer className="footer">
          <p className="footer-copy">© 2026 GolfCharity Platform Ltd. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
