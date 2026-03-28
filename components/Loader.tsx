'use client'
export default function Loader({ text = 'Loading...' }: { text?: string }) {
  return (
    <>
      <style>{`
        .ld{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:20px;}
        .ld-spin{width:44px;height:44px;border:2px solid rgba(201,168,76,.1);border-top-color:#C9A84C;border-radius:50%;animation:ldspin .8s linear infinite;}
        @keyframes ldspin{to{transform:rotate(360deg)}}
        .ld-txt{font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:#7A8A79;}
      `}</style>
      <div className="ld">
        <div className="ld-spin" />
        <div className="ld-txt">{text}</div>
      </div>
    </>
  )
}
