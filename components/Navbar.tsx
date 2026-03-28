'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState<boolean>(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dropOpen, setDropOpen] = useState<boolean>(false)
  const dropRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20)
  window.addEventListener('scroll', onScroll)

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) return

    const user = session.user
    setUser(user)

    const { data: profile, error } = await supabase
      .from('users')
      .select('role, avatar_url')
      .eq('id', user.id)
      .single()

    if (!error && profile) {
      setIsAdmin(profile.role === 'admin')
      setAvatarUrl(profile.avatar_url ?? null)
    }
  }

  init()

  const handleOutside = (e: MouseEvent) => {
    if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
      setDropOpen(false)
    }
  }

  document.addEventListener('mousedown', handleOutside)

  return () => {
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('mousedown', handleOutside)
  }
}, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setDropOpen(false)
    router.push('/')
  }

  const getInitials = (): string => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .nb {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 48px; transition: all .4s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .nb.sc {
          background: rgba(8,12,7,.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(201,168,76,.15); padding: 14px 48px;
        }

        .nb-logo {
          font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700;
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; color: #FAF6EE; text-decoration: none;
        }
        .nb-logo-ic {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #C9A84C, #8B6914);
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 16px;
        }
        .nb-logo span { color: #C9A84C; }

        .nb-links { display: flex; align-items: center; gap: 28px; }

        .nb-lnk {
          background: none; border: none; color: rgba(250,246,238,.6);
          font-family: 'DM Sans', sans-serif; font-size: .88rem;
          letter-spacing: .04em; cursor: pointer; transition: color .2s;
          text-transform: uppercase;
        }
        .nb-lnk:hover { color: #FAF6EE; }

        .nb-cta {
          background: none; border: 1px solid #C9A84C; color: #C9A84C;
          font-family: 'DM Sans', sans-serif; font-size: .82rem;
          letter-spacing: .08em; text-transform: uppercase;
          padding: 9px 22px; cursor: pointer;
          transition: all .3s ease; position: relative; overflow: hidden;
        }
        .nb-cta::before {
          content: ''; position: absolute; inset: 0; background: #C9A84C;
          transform: translateX(-100%); transition: transform .3s ease; z-index: -1;
        }
        .nb-cta:hover::before { transform: translateX(0); }
        .nb-cta:hover { color: #080C07; }

        .nb-cta-solid {
          background: linear-gradient(135deg, #C9A84C, #E8C060); color: #080C07;
          border: none; font-family: 'DM Sans', sans-serif; font-size: .82rem;
          font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          padding: 9px 22px; cursor: pointer;
          transition: transform .2s, box-shadow .3s;
        }
        .nb-cta-solid:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(201,168,76,.3); }

        .nb-admin-btn {
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.35);
          color: #C9A84C; font-family: 'DM Sans', sans-serif; font-size: .78rem;
          font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          padding: 8px 18px; cursor: pointer; transition: all .3s ease;
          display: flex; align-items: center; gap: 7px;
        }
        .nb-admin-btn:hover {
          background: rgba(201,168,76,0.18);
          border-color: rgba(201,168,76,0.6);
          box-shadow: 0 0 16px rgba(201,168,76,0.15);
        }

        .nb-avatar-wrap { position: relative; }
        .nb-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid rgba(201,168,76,0.4);
          cursor: pointer; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #1A4A2E, #0E1510);
          transition: border-color .25s, box-shadow .25s;
          font-family: 'Playfair Display', serif;
          font-size: .95rem; font-weight: 700; color: #C9A84C;
          flex-shrink: 0; user-select: none;
        }
        .nb-avatar:hover {
          border-color: #C9A84C;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
        }
        .nb-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .nb-avatar-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #3DBA6E; border: 1.5px solid #080C07;
          pointer-events: none;
        }

        .nb-drop {
          position: absolute; top: calc(100% + 12px); right: 0;
          background: #0E1510; border: 1px solid rgba(201,168,76,0.15);
          min-width: 210px; z-index: 200;
          animation: dropIn .18s ease;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-drop-header {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .nb-drop-email {
          font-size: .75rem; color: #7A8A79; font-weight: 300;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 174px;
        }
        .nb-drop-role {
          font-size: .65rem; letter-spacing: .1em; text-transform: uppercase;
          color: #C9A84C; margin-top: 3px;
        }
        .nb-drop-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px; font-size: .85rem; color: rgba(250,246,238,.7);
          cursor: pointer; transition: all .2s; background: none; border: none;
          width: 100%; text-align: left; font-family: 'DM Sans', sans-serif;
        }
        .nb-drop-item:hover { background: rgba(201,168,76,0.06); color: #FAF6EE; }
        .nb-drop-item.danger { color: rgba(252,165,165,0.7); }
        .nb-drop-item.danger:hover { background: rgba(239,68,68,0.06); color: #FCA5A5; }
        .nb-drop-item span { font-size: 15px; }
        .nb-drop-divider { height: 1px; background: rgba(201,168,76,0.08); margin: 4px 0; }

        @media (max-width: 768px) {
          .nb { padding: 14px 20px; }
          .nb.sc { padding: 12px 20px; }
          .nb-lnk { display: none; }
          .nb-cta { display: none; }
        }
      `}</style>

      <nav className={`nb${scrolled ? ' sc' : ''}`}>

        {/* LOGO */}
        <div className="nb-logo" onClick={() => router.push('/')}>
          <div className="nb-logo-ic">⛳</div>
          Golf<span>Charity</span>
        </div>

        {/* LINKS */}
        <div className="nb-links">
          <button className="nb-lnk" onClick={() => router.push('/how-it-works')}>How It Works</button>
          <button className="nb-lnk" onClick={() => router.push('/charities')}>Charities</button>
          <button className="nb-lnk" onClick={() => router.push('/pricing')}>Pricing</button>

          {user ? (
            <>
              {/* Admin badge — only shown to admins */}
              {isAdmin && (
                <button className="nb-admin-btn" onClick={() => router.push('/admin')}>
                  ⚙ Admin Panel
                </button>
              )}

              {/* Avatar + dropdown */}
              <div className="nb-avatar-wrap" ref={dropRef}>
                <div className="nb-avatar" onClick={() => setDropOpen(prev => !prev)}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="profile" />
                    : getInitials()
                  }
                </div>
                <div className="nb-avatar-dot" />

                {dropOpen && (
                  <div className="nb-drop">
                    <div className="nb-drop-header">
                      <div className="nb-drop-email">{user.email}</div>
                      <div className="nb-drop-role">
                        {isAdmin ? '⚙ Administrator' : '👤 Subscriber'}
                      </div>
                    </div>

                    <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/dashboard') }}>
                      <span>🏠</span> Dashboard
                    </button>
                    <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/dashboard/scores') }}>
                      <span>⛳</span> My Scores
                    </button>
                    <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/dashboard/draws') }}>
                      <span>🎯</span> My Draws
                    </button>

                    {isAdmin && (
                      <>
                        <div className="nb-drop-divider" />
                        <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/admin') }}>
                          <span>⚙</span> Admin Panel
                        </button>
                        <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/admin/users') }}>
                          <span>👥</span> Manage Users
                        </button>
                      </>
                    )}

                    <div className="nb-drop-divider" />
                    <button className="nb-drop-item" onClick={() => { setDropOpen(false); router.push('/dashboard/settings') }}>
                      <span>⚙</span> Settings
                    </button>
                    <button className="nb-drop-item danger" onClick={handleLogout}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="nb-lnk" onClick={() => router.push('/login')}>Sign In</button>
              <button className="nb-cta" onClick={() => router.push('/signup')}>Get Started</button>
            </>
          )}
        </div>

      </nav>
    </>
  )
}