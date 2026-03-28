'use client'
export const dynamic = "force-dynamic";
import NavBar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { type JSX } from 'react'
interface Feature {
  icon: string
  title: string
  desc: string
}

interface Stat {
  value: string
  label: string
}

export default function Home(): JSX.Element {
  const router = useRouter()
  const [scrollY, setScrollY] = useState<number>(0)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [activeFeature, setActiveFeature] = useState<number>(0)
  const heroRef = useRef<HTMLElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const features: Feature[] = [
    { icon: '⛳', title: 'Monthly Prize Draws', desc: 'Win incredible prizes every single month' },
    { icon: '💚', title: 'Charity Contributions', desc: 'Every game funds causes that matter' },
    { icon: '📊', title: 'Smart Score Tracking', desc: 'AI-powered performance analytics' },
    { icon: '🔒', title: 'Secure Payments', desc: 'Bank-grade encryption on all transactions' },
    { icon: '🏆', title: 'Modern Dashboard', desc: 'Beautiful real-time insights' },
    { icon: '🎲', title: 'Fair Draw System', desc: 'Verifiably random, blockchain-certified' },
  ]

  const stats: Stat[] = [
    { value: '12,400+', label: 'Active Players' },
    { value: '£340K', label: 'Donated to Charities' },
    { value: '98', label: 'Monthly Prize Draws' },
    { value: '4.9★', label: 'Player Rating' },
  ]

  return (
    <>
    <NavBar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --gold: #C9A84C;
          --gold-light: #F0D080;
          --gold-dim: #8B6914;
          --green: #1A4A2E;
          --green-mid: #2D6A44;
          --green-bright: #3DBA6E;
          --cream: #FAF6EE;
          --dark: #080C07;
          --dark2: #0E1510;
          --text-muted: #7A8A79;
        }

        html { scroll-behavior: smooth; cursor: none; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--dark);
          color: var(--cream);
          overflow-x: hidden;
        }

        /* CUSTOM CURSOR */
        .cursor-ring {
          position: fixed;
          width: 40px; height: 40px;
          border: 1.5px solid var(--gold);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.12s ease;
          mix-blend-mode: difference;
        }
        .cursor-dot {
          position: fixed;
          width: 8px; height: 8px;
          background: var(--gold);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transition: transform 0.05s linear;
        }

        /* NOISE OVERLAY */
        .noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* NAVBAR */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 48px;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          background: rgba(8, 12, 7, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(201, 168, 76, 0.15);
          padding: 14px 48px;
        }
        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-logo span { color: var(--gold); }
        .logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          background: none;
          border: none;
          color: rgba(250, 246, 238, 0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
          cursor: none;
          transition: color 0.2s;
          text-transform: uppercase;
        }
        .nav-link:hover { color: var(--cream); }
        .nav-cta {
          background: none;
          border: 1px solid var(--gold);
          color: var(--gold);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 24px;
          cursor: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .nav-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gold);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: -1;
        }
        .nav-cta:hover::before { transform: translateX(0); }
        .nav-cta:hover { color: var(--dark); }

        /* HERO */
        .hero {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(29, 74, 46, 0.35) 0%, transparent 70%),
                      radial-gradient(ellipse 40% 40% at 10% 80%, rgba(201, 168, 76, 0.08) 0%, transparent 60%),
                      var(--dark);
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(29, 74, 46, 0.4), transparent);
          top: -100px; right: -100px;
        }
        .orb2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.15), transparent);
          bottom: 100px; left: 10%;
          animation-delay: -3s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          padding: 0 80px;
          max-width: 800px;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(201, 168, 76, 0.3);
          padding: 6px 16px;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 32px;
          opacity: 0;
          animation: fadeUp 0.8s 0.3s forwards;
        }
        .eyebrow-dot {
          width: 6px; height: 6px;
          background: var(--green-bright);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3.5rem, 7vw, 6.5rem);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: -0.02em;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeUp 0.8s 0.5s forwards;
        }
        .hero-title .accent {
          color: transparent;
          -webkit-text-stroke: 1.5px var(--gold);
          display: block;
        }
        .hero-title .green-text { color: var(--green-bright); }
        .hero-sub {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 480px;
          margin-bottom: 48px;
          font-weight: 300;
          opacity: 0;
          animation: fadeUp 0.8s 0.7s forwards;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          opacity: 0;
          animation: fadeUp 0.8s 0.9s forwards;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--gold), #E8C060);
          color: var(--dark);
          border: none;
          padding: 16px 36px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: none;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.3s;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 60px rgba(201, 168, 76, 0.35); }
        .btn-primary:hover::after { opacity: 0.1; }
        .btn-ghost {
          background: none;
          border: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
          cursor: none;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 0;
          transition: gap 0.3s;
        }
        .btn-ghost:hover { gap: 16px; }
        .arrow-icon {
          width: 36px; height: 36px;
          border: 1px solid rgba(250, 246, 238, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: border-color 0.3s, background 0.3s;
        }
        .btn-ghost:hover .arrow-icon {
          border-color: var(--gold);
          background: rgba(201, 168, 76, 0.1);
        }

        /* HERO VISUAL */
        .hero-visual {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 45%;
          height: 80vh;
          opacity: 0;
          animation: fadeIn 1.2s 0.6s forwards;
        }
        .golf-card {
          position: absolute;
          background: rgba(14, 21, 16, 0.8);
          border: 1px solid rgba(201, 168, 76, 0.2);
          backdrop-filter: blur(20px);
          padding: 24px;
          border-radius: 2px;
        }
        .card-main {
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          width: 280px;
        }
        .card-score-label {
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .card-score {
          font-family: 'Playfair Display', serif;
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          color: var(--cream);
        }
        .card-score span { color: var(--green-bright); font-size: 2rem; }
        .card-bar-wrap { margin-top: 20px; }
        .card-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .card-bar {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .card-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green-bright), var(--gold));
          border-radius: 2px;
          animation: barGrow 2s ease forwards;
          transform-origin: left;
          transform: scaleX(0);
        }
        @keyframes barGrow { to { transform: scaleX(1); } }
        .card-charity {
          top: 15%;
          right: 240px;
          width: 200px;
          animation: floatCard 6s ease-in-out infinite;
        }
        .card-prize {
          bottom: 15%;
          right: 300px;
          width: 220px;
          animation: floatCard 6s 2s ease-in-out infinite;
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .charity-amount {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--green-bright);
        }
        .prize-amount {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--gold);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* MARQUEE */
        .marquee-wrap {
          background: var(--gold);
          padding: 14px 0;
          overflow: hidden;
          display: flex;
        }
        .marquee-track {
          display: flex;
          animation: marquee 25s linear infinite;
          white-space: nowrap;
        }
        .marquee-item {
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dark);
          font-weight: 500;
          padding: 0 40px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .marquee-sep { color: rgba(8,12,7,0.3); }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* STATS */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(201, 168, 76, 0.08);
          border-top: 1px solid rgba(201, 168, 76, 0.1);
          border-bottom: 1px solid rgba(201, 168, 76, 0.1);
        }
        .stat-item {
          padding: 48px 40px;
          background: var(--dark);
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }
        .stat-item::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        .stat-item:hover::before { transform: scaleX(1); }
        .stat-item:hover { background: var(--dark2); }
        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 900;
          color: var(--gold);
          display: block;
          line-height: 1;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* SECTIONS */
        .section { padding: 120px 80px; }
        .section-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-eyebrow::after {
          content: '';
          flex: 1;
          max-width: 40px;
          height: 1px;
          background: var(--gold);
          opacity: 0.4;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 80px;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }
        .step-card {
          background: var(--dark2);
          border: 1px solid rgba(201, 168, 76, 0.06);
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
          cursor: none;
        }
        .step-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(29, 74, 46, 0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .step-card:hover { border-color: rgba(201, 168, 76, 0.25); transform: translateY(-4px); }
        .step-card:hover::before { opacity: 1; }
        .step-num {
          font-family: 'Playfair Display', serif;
          font-size: 5rem;
          font-weight: 900;
          color: rgba(201, 168, 76, 0.08);
          line-height: 1;
          position: absolute;
          top: 24px; right: 32px;
          transition: color 0.3s;
        }
        .step-card:hover .step-num { color: rgba(201, 168, 76, 0.15); }
        .step-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, rgba(29, 74, 46, 0.5), rgba(29, 74, 46, 0.2));
          border: 1px solid rgba(61, 186, 110, 0.2);
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 24px;
        }
        .step-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .step-desc {
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 0.95rem;
          font-weight: 300;
        }

        /* FEATURES */
        .features-section {
          padding: 120px 80px;
          background: var(--dark2);
          border-top: 1px solid rgba(201, 168, 76, 0.06);
        }
        .features-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .features-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 28px;
          border: 1px solid transparent;
          transition: all 0.3s;
          cursor: none;
        }
        .feature-row.active {
          background: rgba(29, 74, 46, 0.15);
          border-color: rgba(61, 186, 110, 0.2);
        }
        .feature-row:hover {
          background: rgba(201, 168, 76, 0.05);
          border-color: rgba(201, 168, 76, 0.12);
        }
        .feature-icon {
          font-size: 1.5rem;
          width: 44px;
          text-align: center;
          flex-shrink: 0;
        }
        .feature-text h4 {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 3px;
        }
        .feature-text p {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-weight: 300;
        }
        .feature-indicator {
          margin-left: auto;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: transparent;
          transition: background 0.3s;
          flex-shrink: 0;
        }
        .feature-row.active .feature-indicator { background: var(--green-bright); }
        .features-display {
          aspect-ratio: 1;
          background: rgba(8, 12, 7, 0.6);
          border: 1px solid rgba(201, 168, 76, 0.1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .features-display::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(29, 74, 46, 0.2), transparent 70%);
          animation: bgPulse 4s ease-in-out infinite;
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .display-emoji {
          font-size: 6rem;
          animation: emojiPop 0.4s ease;
          position: relative;
          z-index: 2;
        }
        @keyframes emojiPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .display-title {
          position: absolute;
          bottom: 40px;
          left: 0; right: 0;
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--gold);
          z-index: 2;
        }

        /* CHARITY */
        .charity-section {
          padding: 120px 80px;
          position: relative;
          overflow: hidden;
        }
        .charity-section::before {
          content: '';
          position: absolute;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(29, 74, 46, 0.2), transparent);
          pointer-events: none;
        }
        .charity-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .impact-board {
          background: var(--dark2);
          border: 1px solid rgba(201, 168, 76, 0.12);
          padding: 48px;
        }
        .impact-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid rgba(201, 168, 76, 0.06);
        }
        .impact-row:last-child { border-bottom: none; }
        .impact-name { font-size: 0.9rem; color: var(--cream); }
        .impact-amount {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--green-bright);
        }
        .progress-bar {
          width: 80px; height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green-mid), var(--green-bright));
          border-radius: 2px;
        }

        /* CTA */
        .cta-section {
          position: relative;
          padding: 140px 80px;
          text-align: center;
          overflow: hidden;
        }
        .cta-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(29, 74, 46, 0.5), transparent), var(--dark);
        }
        .cta-border-top {
          position: absolute;
          top: 0; left: 80px; right: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 900;
          line-height: 1.05;
          margin-bottom: 24px;
          position: relative;
          z-index: 2;
        }
        .cta-sub {
          color: var(--text-muted);
          font-size: 1.1rem;
          font-weight: 300;
          margin-bottom: 48px;
          position: relative;
          z-index: 2;
        }
        .cta-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        /* FOOTER */
        .footer {
          background: var(--dark2);
          border-top: 1px solid rgba(201, 168, 76, 0.08);
          padding: 60px 80px 40px;
        }
        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }
        .footer-brand p {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 260px;
          line-height: 1.6;
          margin-top: 12px;
          font-weight: 300;
        }
        .footer-links { display: flex; gap: 60px; }
        .footer-col h5 {
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
        }
        .footer-col a {
          display: block;
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 10px;
          text-decoration: none;
          cursor: none;
          transition: color 0.2s;
        }
        .footer-col a:hover { color: var(--cream); }
        .footer-bottom {
          border-top: 1px solid rgba(201, 168, 76, 0.06);
          padding-top: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-copy { font-size: 0.8rem; color: rgba(122, 138, 121, 0.5); }
        .footer-gold-line { font-size: 0.75rem; color: var(--gold-dim); letter-spacing: 0.06em; }

        /* PAGE LOAD */
        .page-wrap {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .page-wrap.loaded { opacity: 1; transform: translateY(0); }

        @media (max-width: 1024px) {
          .hero-visual { display: none; }
          .hero-content { padding: 0 40px; max-width: 100%; }
          .stats-section { grid-template-columns: repeat(2, 1fr); }
          .steps-grid, .features-layout, .charity-layout { grid-template-columns: 1fr; }
          .section, .features-section, .charity-section { padding: 80px 40px; }
          .footer { padding: 60px 40px 40px; }
          .footer-top { flex-direction: column; gap: 40px; }
          .nav { padding: 16px 24px; }
          .nav.scrolled { padding: 12px 24px; }
        }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <div className="noise" />

      <div className={`page-wrap ${isLoaded ? 'loaded' : ''}`}>

        {/* NAVBAR */}


        {/* HERO */}
        <section className="hero" ref={heroRef}>
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              Season 2026 — Now Open
            </div>
            <h1 className="hero-title">
              Play Golf.
              <span className="accent">Win Big.</span>
              <span className="green-text">Give Back.</span>
            </h1>
            <p className="hero-sub">
              Track your scores, compete in monthly prize draws, and automatically
              support charities you love — all in one beautifully designed platform.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => router.push('/pricing')}>
                Start Playing
              </button>
              <button className="btn-ghost" onClick={() => router.push('/how-it-works')}>
                Watch how it works
                <span className="arrow-icon">→</span>
              </button>
            </div>
          </div>

          {/* FLOATING CARDS */}
          <div className="hero-visual">
            <div className="golf-card card-main">
              <div className="card-score-label">Your Score — Round 18</div>
              <div className="card-score">-4 <span>🏌️</span></div>
              <div className="card-bar-wrap">
                {['Driving', 'Iron Play', 'Putting'].map((label, i) => (
                  <div key={i}>
                    <div className="card-bar-label">
                      <span>{label}</span>
                      <span>{[92, 78, 85][i]}%</span>
                    </div>
                    <div className="card-bar">
                      <div className="card-bar-fill" style={{ width: `${[92, 78, 85][i]}%`, animationDelay: `${i * 0.2}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="golf-card card-charity">
              <div className="card-score-label">This Month's Impact</div>
              <div className="charity-amount">£2,840</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Donated to St. Jude's</div>
            </div>
            <div className="golf-card card-prize">
              <div className="card-score-label">🏆 Next Prize Draw</div>
              <div className="prize-amount">£5,000</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>April 30 · 847 entries</div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...Array(2)].map((_, rep) => (
              <div key={rep} style={{ display: 'flex' }}>
                {['Monthly Prize Draws', 'Charity Contributions', 'Smart Score Tracking', 'Secure Payments', 'Fair Draw System', 'Community of 12K+ Players', 'Season 2026 Now Open'].map((item, i) => (
                  <div key={i} className="marquee-item">
                    {item} <span className="marquee-sep">◆</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div className="stats-section">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section className="section">
          <div className="section-eyebrow">The Process</div>
          <h2 className="section-title">
            Three steps to<br />
            <span style={{ color: 'var(--gold)' }}>play, win & give.</span>
          </h2>
          <div className="steps-grid">
            {[
              { icon: '📝', title: 'Enter Your Scores', desc: 'Log your round scores in seconds. Our smart system tracks your handicap, trends, and performance across every game you play.' },
              { icon: '🎯', title: 'Join Prize Draws', desc: 'Every score submission earns you entries into our monthly prize draws. The more you play, the more chances you have to win big.' },
              { icon: '💚', title: 'Win & Give Back', desc: 'When you win, so does your chosen charity. A percentage of every prize pool is automatically donated in your name.' },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">0{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section">
          <div className="features-layout">
            <div>
              <div className="section-eyebrow">Everything You Need</div>
              <h2 className="section-title" style={{ marginBottom: 40 }}>
                Built for serious<br />
                <span style={{ color: 'var(--green-bright)' }}>golfers.</span>
              </h2>
              <div className="features-list">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className={`feature-row ${activeFeature === i ? 'active' : ''}`}
                    onMouseEnter={() => setActiveFeature(i)}
                  >
                    <div className="feature-icon">{f.icon}</div>
                    <div className="feature-text">
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                    <div className="feature-indicator" />
                  </div>
                ))}
              </div>
            </div>
            <div className="features-display">
              <div key={activeFeature} className="display-emoji">{features[activeFeature].icon}</div>
              <div className="display-title">{features[activeFeature].title}</div>
            </div>
          </div>
        </section>

        {/* CHARITY */}
        <section className="charity-section">
          <div className="charity-layout">
            <div>
              <div className="section-eyebrow">Real Impact</div>
              <h2 className="section-title">
                Your game funds<br />
                <span style={{ color: 'var(--green-bright)' }}>real causes.</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, fontWeight: 300, maxWidth: 440 }}>
                Every subscription automatically directs a portion of your fees to the charity of your choice. Play your best game while making a tangible difference in the world.
              </p>
              <button className="btn-primary" onClick={() => router.push('/charities')}>
                Explore Charities
              </button>
            </div>
            <div className="impact-board">
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 28 }}>
                Top Funded This Month
              </div>
              {[
                { name: "St. Jude Children's Hospital", amount: '£8,420', pct: 84 },
                { name: 'Cancer Research UK', amount: '£6,710', pct: 67 },
                { name: "Alzheimer's Society", amount: '£5,180', pct: 52 },
                { name: 'British Heart Foundation', amount: '£4,340', pct: 43 },
                { name: 'RNLI', amount: '£3,920', pct: 39 },
              ].map((c, i) => (
                <div key={i} className="impact-row">
                  <span className="impact-name">{c.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="impact-amount">{c.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-bg" />
          <div className="cta-border-top" />
          <h2 className="cta-title">
            Ready to tee off<br />
            <span style={{ color: 'var(--gold)' }}>and give back?</span>
          </h2>
          <p className="cta-sub">Join 12,400+ players. First month free. Cancel anytime.</p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => router.push('/pricing')}>
              Start Today
            </button>
            <button className="btn-ghost" onClick={() => router.push('/charities')}>
              Already a member?
              <span className="arrow-icon">→</span>
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-logo">
                <div className="logo-icon">⛳</div>
                Golf<span>Charity</span>
              </div>
              <p>Where every swing creates a ripple of change. Play the game you love, and leave the world better than you found it.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h5>Platform</h5>
                <a href="#">How It Works</a>
                <a href="#">Scorecard</a>
                <a href="#">Prize Draws</a>
                <a href="#">Dashboard</a>
              </div>
              <div className="footer-col">
                <h5>Causes</h5>
                <a href="#">Browse Charities</a>
                <a href="#">Impact Reports</a>
                <a href="#">Partner With Us</a>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 GolfCharity Platform Ltd. All rights reserved.</span>
            <span className="footer-gold-line">Designed with ♥ for golfers who care</span>
          </div>
        </footer>

      </div>
    </>
  )
}