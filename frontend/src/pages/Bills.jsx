import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'

const DEFAULT_PARTICLE_COUNT = 12
const DEFAULT_GLOW_COLOR = '216, 159, 246'

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`
  return el
}

const BentoCard = ({ children, className, style, glowColor = DEFAULT_GLOW_COLOR, particleCount = DEFAULT_PARTICLE_COUNT }) => {
  const cardRef = useRef(null)
  const particlesRef = useRef([])
  const timeoutsRef = useRef([])
  const isHoveredRef = useRef(false)
  const memoizedParticles = useRef([])
  const particlesInitialized = useRef(false)

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return
    const { width, height } = cardRef.current.getBoundingClientRect()
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    )
    particlesInitialized.current = true
  }, [particleCount, glowColor])

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    particlesRef.current.forEach(particle => {
      gsap.to(particle, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => particle.parentNode?.removeChild(particle) })
    })
    particlesRef.current = []
  }, [])

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return
    if (!particlesInitialized.current) initializeParticles()
    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return
        const clone = particle.cloneNode(true)
        cardRef.current.appendChild(clone)
        particlesRef.current.push(clone)
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
        gsap.to(clone, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true })
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true })
      }, index * 100)
      timeoutsRef.current.push(timeoutId)
    })
  }, [initializeParticles])

  useEffect(() => {
    if (!cardRef.current) return
    const element = cardRef.current
    const handleMouseEnter = () => { isHoveredRef.current = true; animateParticles(); gsap.to(element, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 }) }
    const handleMouseLeave = () => { isHoveredRef.current = false; clearAllParticles(); gsap.to(element, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' }) }
    const handleMouseMove = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left; const y = e.clientY - rect.top
      element.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`)
      element.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`)
      element.style.setProperty('--glow-intensity', '1')
      gsap.to(element, { rotateX: ((y - rect.height/2) / rect.height) * -10, rotateY: ((x - rect.width/2) / rect.width) * 10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 })
    }
    const handleClick = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left; const y = e.clientY - rect.top
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height))
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:absolute;width:${maxDistance*2}px;height:${maxDistance*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-maxDistance}px;top:${y-maxDistance}px;pointer-events:none;z-index:1000;`
      element.appendChild(ripple)
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() })
    }
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('click', handleClick)
    return () => {
      isHoveredRef.current = false
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('click', handleClick)
      clearAllParticles()
    }
  }, [animateParticles, clearAllParticles, glowColor])

  return (
    <div ref={cardRef} className={className} style={{ ...style, position: 'relative', overflow: 'hidden', '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', '--glow-radius': '200px', '--glow-color': glowColor }}>
      {children}
    </div>
  )
}

const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox>
  </ModalOverlay>
)

const Bills = () => {
  const [showModal, setShowModal] = useState(false)

  const stats = [
    { label: 'Due This Month',  value: '$1,385', sub: '4 bills remaining', color: '#ffaa00', icon: '📅' },
    { label: 'Due Soon',        value: '$1,200', sub: 'within 3 days',     color: '#ff6b6b', icon: '⚠️' },
    { label: 'Paid This Month', value: '$955',   sub: '3 bills paid',      color: '#00ff87', icon: '✅' },
    { label: 'Monthly Avg',     value: '$2,340', sub: 'recurring bills',   color: '#D89FF6', icon: '🔁' },
  ]

  const upcoming = [
    { icon: '🏠', name: 'Rent',        category: 'Housing · Monthly',  amount: 1200, due: 'Mar 15', urgency: 'urgent', color: '#ff6b6b' },
    { icon: '⚡', name: 'Electricity', category: 'Utilities · Monthly', amount: 85,   due: 'Mar 18', urgency: 'soon',   color: '#ffaa00' },
    { icon: '📱', name: 'Phone Bill',  category: 'Telecom · Monthly',   amount: 40,   due: 'Mar 20', urgency: 'safe',   color: '#00e5ff' },
    { icon: '🌐', name: 'Internet',    category: 'Utilities · Monthly', amount: 60,   due: 'Mar 22', urgency: 'safe',   color: '#D89FF6' },
  ]

  const paid = [
    { icon: '🎬', name: 'Netflix',         date: 'Paid Mar 12', amount: 15 },
    { icon: '🏋️', name: 'Gym Membership',  date: 'Paid Mar 6',  amount: 40 },
    { icon: '🎵', name: 'Spotify Premium', date: 'Paid Mar 1',  amount: 10 },
  ]

  const urgencyStyle = {
    urgent: { bg: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: 'rgba(255,107,107,0.2)', label: 'Due in 2 days' },
    soon:   { bg: 'rgba(255,170,0,0.1)',   color: '#ffaa00', border: 'rgba(255,170,0,0.2)',   label: 'Due in 5 days' },
    safe:   { bg: 'rgba(0,255,135,0.08)',  color: '#00ff87', border: 'rgba(0,255,135,0.15)',  label: 'Scheduled'     },
  }

  const iconBg = {
    '#ff6b6b': 'rgba(255,107,107,0.1)',
    '#ffaa00': 'rgba(255,170,0,0.1)',
    '#00e5ff': 'rgba(0,229,255,0.1)',
    '#D89FF6': 'rgba(216,159,246,0.1)',
  }

  return (
    <Wrapper>
      <style>{`
        .bento-card--glow::after {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
            rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
            rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 30%,
            transparent 60%);
          border-radius: inherit;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }
        .bento-card--glow:hover {
          box-shadow: 0 4px 20px rgba(46,24,78,0.4), 0 0 30px rgba(216,159,246,0.15);
        }
      `}</style>

      <Navbar />
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Bills</h1>
            <p className="page-sub">Stay on top of every upcoming payment</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ Add Bill</button>
        </div>

        <div className="stat-grid">
          {stats.map((s, i) => (
            <BentoCard key={i} className="stat-card bento-card--glow">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color: s.color }}>{s.sub}</div>
            </BentoCard>
          ))}
        </div>

        <div className="alert">
          <span>🔔</span>
          <div><strong>Rent ($1,200) is due in 2 days</strong> — Mar 15, 2026. Ensure sufficient funds.</div>
        </div>

        <div className="section-label">⚡ Upcoming Bills</div>
        <div className="bento-grid">
          {upcoming.map((b, i) => {
            const u = urgencyStyle[b.urgency]
            return (
              <BentoCard key={i} className={`bill-card ${b.urgency} bento-card--glow`} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="bill-top">
                  <div className="bill-ico" style={{ background: iconBg[b.color] }}>{b.icon}</div>
                  <span className="pill" style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}>{u.label}</span>
                </div>
                <div className="bill-name">{b.name}</div>
                <div className="bill-cat">{b.category}</div>
                <div className="bill-amt" style={{ color: b.color }}>${b.amount.toLocaleString()}.00</div>
                <div className="bill-due">📅 {b.due}, 2026</div>
                <button className="pay-btn">Pay Now</button>
              </BentoCard>
            )
          })}
        </div>

        <div className="section-label" style={{ marginTop: '28px' }}>✅ Paid This Month</div>
        <div className="paid-list">
          {paid.map((p, i) => (
            <BentoCard key={i} className="paid-row bento-card--glow" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="paid-left">
                <div className="paid-ico">{p.icon}</div>
                <div>
                  <div className="paid-name">{p.name}</div>
                  <div className="paid-date">{p.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="paid-amt">${p.amount}.00</div>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>Paid</span>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="modal-hd">📅 Add Bill<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="f-group"><label className="f-label">Bill Name</label><input className="f-input" placeholder="e.g. Electricity" /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Amount ($)</label><input className="f-input" type="number" placeholder="0.00" /></div>
            <div className="f-group"><label className="f-label">Due Date</label><input className="f-input" type="date" /></div>
          </div>
          <div className="f-group"><label className="f-label">Category</label>
            <select className="f-sel"><option>Housing</option><option>Utilities</option><option>Telecom</option><option>Subscriptions</option><option>Insurance</option><option>Other</option></select>
          </div>
          <div className="f-group"><label className="f-label">Frequency</label>
            <select className="f-sel"><option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>One-time</option></select>
          </div>
          <button className="f-submit">Add Bill</button>
        </Modal>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;
  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }
  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn { display: flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #7c3aed, #D89FF6); border: none; border-radius: 12px; padding: 10px 18px; color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .add-btn:hover { opacity: 0.85; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 20px; }
  .stat-card { background: #060010; border: 1px solid #392e4e; border-radius: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
  .stat-card:hover { transform: translateY(-2px); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }
  .alert { display: flex; align-items: center; gap: 12px; background: rgba(255,107,107,0.07); border: 1px solid rgba(255,107,107,0.18); border-radius: 13px; padding: 13px 18px; margin-bottom: 22px; font-size: 13px; color: rgba(255,255,255,0.8); }
  .alert strong { color: #ff6b6b; }
  .section-label { font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px; }
  .bento-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .bill-card { background: #060010; border: 1px solid #392e4e; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; animation: fadeUp 0.4s ease both; transition: transform 0.2s; }
  .bill-card:hover { transform: translateY(-3px); }
  .bill-card.urgent { border-color: rgba(255,107,107,0.35); }
  .bill-card.soon { border-color: rgba(255,170,0,0.25); }
  .bill-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .bill-ico { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .bill-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; margin-top: 4px; }
  .bill-cat { font-size: 11px; color: rgba(255,255,255,0.38); }
  .bill-amt { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .bill-due { font-size: 12px; color: rgba(255,255,255,0.38); }
  .pay-btn { background: rgba(216,159,246,0.08); border: 1px solid rgba(216,159,246,0.2); border-radius: 10px; padding: 9px; color: #D89FF6; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; width: 100%; margin-top: auto; }
  .pay-btn:hover { background: rgba(216,159,246,0.18); }
  .pill { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .paid-list { display: flex; flex-direction: column; gap: 10px; }
  .paid-row { background: #060010; border: 1px solid #392e4e; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; animation: fadeUp 0.4s ease both; }
  .paid-row:hover { border-color: rgba(255,255,255,0.12); }
  .paid-left { display: flex; align-items: center; gap: 12px; }
  .paid-ico { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.045); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .paid-name { font-size: 13px; font-weight: 600; }
  .paid-date { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .paid-amt { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`
const ModalOverlay = styled.div`position:fixed;inset:0;z-index:999;background:rgba(0,0,0,0.72);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;`
const ModalBox = styled.div`
  background:#0d0020;border:1px solid #281a44;border-radius:22px;padding:30px;width:420px;font-family:'DM Sans',sans-serif;animation:modalIn 0.28s ease;
  .modal-hd{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;color:white;}
  .x-btn{background:rgba(255,255,255,0.07);border:none;color:rgba(255,255,255,0.4);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;}
  .x-btn:hover{background:rgba(255,107,107,0.15);color:#ff6b6b;}
  .f-group{margin-bottom:14px;}
  .f-label{display:block;font-size:11.5px;font-weight:700;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:7px;}
  .f-input,.f-sel{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 13px;color:white;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.2s;}
  .f-input:focus,.f-sel:focus{border-color:rgba(216,159,246,0.45);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-sel option{background:#0d0020;}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .f-submit{width:100%;background:linear-gradient(135deg,#7c3aed,#D89FF6);border:none;border-radius:11px;padding:12px;color:white;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit:hover{opacity:0.85;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

export default Bills