'use client'

import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'

export default function HowItWorks() {
  const router = useRouter()

  return (
    <>
      <style>{`
        :root {
          --gold:#C9A84C; --green:#3DBA6E; --dark:#080C07; --dark2:#0E1510; --text:#7A8A79;
        }

        body { background: var(--dark); color: white; }

        .section { padding: 120px 80px; }
        .center { text-align: center; }

        /* HERO */
        .hero {
          padding-top: 140px;
          padding-bottom: 100px;
          text-align: center;
          background: radial-gradient(circle at center, rgba(29,74,46,0.3), transparent);
        }

        .hero h1 {
          font-size: 4rem;
          font-weight: 900;
          margin-bottom: 20px;
        }

        .hero span { color: var(--gold); }

        .hero p {
          color: var(--text);
          max-width: 600px;
          margin: auto;
        }

        /* STEPS */
        .steps {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 30px;
        }

        .card {
          background: var(--dark2);
          border: 1px solid rgba(201,168,76,0.1);
          padding: 40px;
          transition: 0.3s;
        }

        .card:hover {
          transform: translateY(-10px);
          border-color: var(--gold);
        }

        .card h3 { margin-bottom: 10px; }
        .card p { color: var(--text); }

        .icon {
          font-size: 2rem;
          margin-bottom: 20px;
        }

        /* DETAILS */
        .details {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 40px;
        }

        .detail-card {
          padding: 40px;
          border: 1px solid rgba(255,255,255,0.05);
          background: linear-gradient(135deg, rgba(29,74,46,0.2), transparent);
          transition: 0.3s;
        }
        .detail-card:hover {
          transform: translateY(-10px);
          border-color: var(--gold);
        }
        .detail-card h4 {
          color: var(--gold);
          margin-bottom: 10px;
        }

        .detail-card p {
          color: var(--text);
        }

        /* CTA */
        .cta {
          text-align: center;
          padding: 120px 20px;
        }

        .cta h2 { font-size: 3rem; margin-bottom: 20px; }

        .btn {
          background: var(--gold);
          padding: 14px 30px;
          border: none;
          cursor: pointer;
        }

        @media(max-width:900px){
          .steps,.details { grid-template-columns:1fr; }
        }
      `}</style>

      <NavBar />

      {/* HERO */}
      <section className="hero">
        <h1>How It <span>Works</span></h1>
        <p>
          A simple yet powerful system that lets you play, win, and give back —
          all in one seamless experience.
        </p>
      </section>

      {/* CORE STEPS */}
      <section className="section">
        <div className="steps">

          <div className="card">
            <div className="icon">📝</div>
            <h3>Enter Your Scores</h3>
            <p>
              Add your latest 5 golf scores. Our system keeps only your most recent
              performances automatically.
            </p>
          </div>

          <div className="card">
            <div className="icon">🎯</div>
            <h3>Join Monthly Draws</h3>
            <p>
              Every score you submit enters you into a monthly prize draw with real cash rewards.
            </p>
          </div>

          <div className="card">
            <div className="icon">💚</div>
            <h3>Win & Give Back</h3>
            <p>
              A portion of your subscription goes to charity — so every game creates impact.
            </p>
          </div>

        </div>
      </section>

      {/* SYSTEM DETAILS */}
      <section className="section">
        <div className="details">

          <div className="detail-card">
            <h4>💳 Subscription System</h4>
            <p>
              Choose monthly or yearly plans. Only active subscribers can access features and participate in draws.
            </p>
          </div>

          <div className="detail-card">
            <h4>📊 Score Logic</h4>
            <p>
              Only your latest 5 scores are stored. Adding a new score automatically removes the oldest one.
            </p>
          </div>

          <div className="detail-card">
            <h4>🎲 Draw Engine</h4>
            <p>
              Monthly draws use either random or algorithm-based logic. Match 3, 4, or 5 numbers to win prizes.
            </p>
          </div>

          <div className="detail-card">
            <h4>❤️ Charity Impact</h4>
            <p>
              Minimum 10% of your subscription goes to your selected charity. You can increase your contribution anytime.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Start?</h2>
        <p style={{color:'#aaa', marginBottom:'20px'}}>
          Join the platform and start winning while making a difference.
        </p>

        <button className="btn" onClick={()=>router.push('/signup')}>
          Get Started
        </button>
      </section>
    </>
  )
}