'use client'
interface CardProps {
  label?: string; value?: string | number; sub?: string; icon?: string;
  accent?: 'gold' | 'green'; children?: React.ReactNode; style?: React.CSSProperties; className?: string;
}
export default function Card({ label, value, sub, icon, accent = 'gold', children, style, className }: CardProps) {
  return (
    <>
      <style>{`
        .gc{background:#0E1510;border:1px solid rgba(201,168,76,.1);padding:28px;position:relative;overflow:hidden;}
        .gc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent);}
        .gc-icon{position:absolute;top:24px;right:24px;font-size:2rem;opacity:.12;}
        .gc-label{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:#C9A84C;margin-bottom:12px;}
        .gc-value{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:900;color:#FAF6EE;line-height:1;}
        .gc-value.green{color:#3DBA6E;}
        .gc-sub{font-size:.78rem;color:#7A8A79;margin-top:8px;}
      `}</style>
      <div className={`gc${className ? ' '+className : ''}`} style={style}>
        {icon && <div className="gc-icon">{icon}</div>}
        {label && <div className="gc-label">{label}</div>}
        {value !== undefined && <div className={`gc-value${accent === 'green' ? ' green' : ''}`}>{value}</div>}
        {sub && <div className="gc-sub">{sub}</div>}
        {children}
      </div>
    </>
  )
}
