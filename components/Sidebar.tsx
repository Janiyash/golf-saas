'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface SidebarItem { id: string; icon: string; label: string; href: string }

const DASH_ITEMS: SidebarItem[] = [
  { id: 'overview', icon: '◈', label: 'Overview', href: '/dashboard' },
  { id: 'scores', icon: '⛳', label: 'My Scores', href: '/dashboard/scores' },
  { id: 'draws', icon: '🎲', label: 'Prize Draws', href: '/dashboard/draws' },
  { id: 'charity', icon: '💚', label: 'My Charity', href: '/dashboard/charity' },
  { id: 'subscription', icon: '◉', label: 'Subscription', href: '/dashboard/subscription' },
  { id: 'winnings', icon: '🏆', label: 'Winnings', href: '/dashboard/winnings' },
  { id: 'profile', icon: '👤', label: 'Profile', href: '/dashboard/profile' },
]

const ADMIN_ITEMS: SidebarItem[] = [
  { id: 'overview', icon: '◈', label: 'Overview', href: '/admin' },
  { id: 'users', icon: '👥', label: 'Users', href: '/admin/users' },
  { id: 'draws', icon: '🎲', label: 'Draws', href: '/admin/draws' },
  { id: 'charities', icon: '💚', label: 'Charities', href: '/admin/charities' },
  { id: 'winners', icon: '🏆', label: 'Winners', href: '/admin/winners' },
  { id: 'reports', icon: '📊', label: 'Reports', href: '/admin/reports' },
]

export default function Sidebar({ isAdmin = false, userName = 'Member', plan = 'Pro Monthly' }: { isAdmin?: boolean; userName?: string; plan?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const items = isAdmin ? ADMIN_ITEMS : DASH_ITEMS

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        .sb{width:260px;min-height:100vh;background:#0E1510;border-right:1px solid rgba(201,168,76,.1);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;padding-top:80px;}
        .sb-user{padding:20px 24px;border-bottom:1px solid rgba(201,168,76,.1);}
        .sb-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2D6A44,#1A4A2E);border:2px solid rgba(201,168,76,.3);display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px;}
        .sb-name{font-size:.95rem;font-weight:500;color:#FAF6EE;}
        .sb-plan{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#C9A84C;margin-top:2px;display:flex;align-items:center;gap:6px;}
        .sb-dot{width:5px;height:5px;background:#3DBA6E;border-radius:50%;animation:sbpulse 2s infinite;}
        @keyframes sbpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .sb-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:2px;}
        .sb-item{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:4px;cursor:pointer;transition:all .2s;border:1px solid transparent;background:none;width:100%;text-align:left;color:#7A8A79;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:400;}
        .sb-item:hover{background:rgba(201,168,76,.05);color:#FAF6EE;border-color:rgba(201,168,76,.08);}
        .sb-item.active{background:rgba(29,74,46,.2);color:#FAF6EE;border-color:rgba(61,186,110,.2);}
        .sb-item.active .sb-icon{color:#3DBA6E;}
        .sb-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0;}
        .sb-bar{width:3px;height:20px;background:#3DBA6E;border-radius:2px;margin-left:auto;opacity:0;transition:opacity .2s;}
        .sb-item.active .sb-bar{opacity:1;}
        .sb-footer{padding:16px 12px;border-top:1px solid rgba(201,168,76,.1);}
        .sb-logout{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:4px;cursor:pointer;transition:all .2s;background:none;border:none;color:#7A8A79;font-family:'DM Sans',sans-serif;font-size:.82rem;width:100%;text-align:left;}
        .sb-logout:hover{color:#FCA5A5;background:rgba(239,68,68,.05);}
      `}</style>
      <aside className="sb">
        <div className="sb-user">
          <div className="sb-avatar">{isAdmin ? '🛡️' : '🏌️'}</div>
          <div className="sb-name">{userName}</div>
          <div className="sb-plan"><span className="sb-dot" />{isAdmin ? 'Admin Access' : `${plan} · Active`}</div>
        </div>
        <nav className="sb-nav">
          {items.map(item => (
            <button key={item.id} className={`sb-item${pathname === item.href ? ' active' : ''}`} onClick={() => router.push(item.href)}>
              <span className="sb-icon">{item.icon}</span>
              {item.label}
              <span className="sb-bar" />
            </button>
          ))}
        </nav>
        <div className="sb-footer">
          <button className="sb-logout" onClick={handleSignOut}><span>↩</span> Sign Out</button>
        </div>
      </aside>
    </>
  )
}
