'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
export default function SuccessPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
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
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--gold:#C9A84C;--gold-light:#F0D080;--green-bright:#3DBA6E;--cream:#FAF6EE;--dark:#080C07;--dark2:#0E1510;--text-muted:#7A8A79;}
        html{cursor:none;} body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);}
        .cursor-ring{position:fixed;width:40px;height:40px;border:1.5px solid var(--gold);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .12s ease;mix-blend-mode:difference;}
        .cursor-dot{position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:10000;transition:transform .05s linear;}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .page{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:40px;position:relative;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(29,74,46,.3),transparent);opacity:0;transition:opacity .6s ease;}
        .page.loaded{opacity:1;}
        .check-ring{width:100px;height:100px;border:2px solid rgba(61,186,110,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 32px;animation:ringPop .6s ease forwards;}
        @keyframes ringPop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        .check-icon{font-size:40px;animation:iconPop .6s .3s ease forwards;opacity:0;}
        @keyframes iconPop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
        .eyebrow{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--green-bright);margin-bottom:16px;}
        .title{font-family:'Playfair Display',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:900;line-height:1.05;margin-bottom:16px;}
        .title span{color:var(--gold);}
        .sub{color:var(--text-muted);font-size:1rem;font-weight:300;max-width:480px;margin:0 auto 48px;line-height:1.7;}
        .steps-mini{display:flex;flex-direction:column;gap:12px;max-width:440px;margin:0 auto 48px;}
        .step-mini{display:flex;align-items:center;gap:14px;padding:14px 20px;background:rgba(14,21,16,.8);border:1px solid rgba(201,168,76,.08);text-align:left;}
        .step-mini-num{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:900;color:rgba(201,168,76,.3);width:24px;flex-shrink:0;}
        .step-mini-txt{font-size:.85rem;color:var(--cream);}
        .btn-dash{background:linear-gradient(135deg,var(--gold),#E8C060);color:var(--dark);border:none;padding:16px 40px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;cursor:none;transition:transform .2s,box-shadow .3s;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));}
        .btn-dash:hover{transform:translateY(-2px);box-shadow:0 20px 60px rgba(201,168,76,.35);}
      `}</style>
      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />
      <div className={`page${isLoaded ? ' loaded' : ''}`}>
        <div className="check-ring"><div className="check-icon">✓</div></div>
        <div className="eyebrow">Payment Successful</div>
        <h1 className="title">You're on the<br /><span>course!</span></h1>
        <p className="sub">Your subscription is now active. Head to your dashboard to log your first score and enter the next prize draw.</p>
        <div className="steps-mini">
          {[{ n: '01', t: 'Log your first Stableford score' }, { n: '02', t: 'Choose your charity partner' }, { n: '03', t: 'You\'re entered in the next draw' }].map((s, i) => (
            <div key={i} className="step-mini"><div className="step-mini-num">{s.n}</div><div className="step-mini-txt">{s.t}</div></div>
          ))}
        </div>
        <button className="btn-dash" onClick={() => router.push('/dashboard')}>Go to My Dashboard →</button>
      </div>
    </>
  )
}
