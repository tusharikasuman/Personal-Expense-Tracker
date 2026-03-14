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

const BentoCard = ({ children, className, style, glowColor = DEFAULT_GLOW_COLOR, particleCount = DEFAULT_PARTICLE_COUNT, onClick }) => {
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
    <div ref={cardRef} className={className} style={{ ...style, position: 'relative', overflow: 'hidden', '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', '--glow-radius': '200px', '--glow-color': glowColor }} onClick={onClick}>
      {children}
    </div>
  )
}

const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox>
  </ModalOverlay>
)

const Savings = () => {
  const [showModal, setShowModal] = useState(false)

  const stats = [
    { label: 'Total Saved',      value: '$7,060', sub: 'across all goals',    color: '#00e5ff', icon: '💰' },
    { label: 'Active Goals',     value: '4',      sub: 'in progress',          color: '#D89FF6', icon: '🎯' },
    { label: 'Saved This Month', value: '$560',   sub: '↑ 18% vs last month', color: '#00ff87', icon: '📈' },
    { label: 'Avg / Month',      value: '$470',   sub: 'across all goals',     color: '#ffaa00', icon: '📊' },
  ]

  const goals = [
    { emoji: '🏖️', name: 'Vacation',        target: 'Goa · Dec 2026',     saved: 1300, total: 2000, color: '#00ff87', monthly: 350 },
    { emoji: '💻', name: 'New Laptop',       target: 'MacBook · Jun 2026', saved: 600,  total: 1500, color: '#D89FF6', monthly: 225 },
    { emoji: '🚗', name: 'Car Down Payment', target: 'New Car · 2027',     saved: 960,  total: 5000, color: '#ffaa00', monthly: 340 },
    { emoji: '🏠', name: 'Emergency Fund',   target: '6 months expenses',  saved: 4200, total: 8000, color: '#00e5ff', monthly: 380 },
  ]

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
            <h1 className="page-title">Savings Goals</h1>
            <p className="page-sub">Dream big, save smart</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ New Goal</button>
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

        <div className="bento-grid">
          {goals.map((g, i) => {
            const pct = Math.round((g.saved / g.total) * 100)
            return (
              <BentoCard key={i} className="goal-card bento-card--glow" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="goal-top-bar" style={{ background: g.color }} />
                <div className="goal-emoji">{g.emoji}</div>
                <div className="goal-name">{g.name}</div>
                <div className="goal-target">{g.target}</div>
                <div className="goal-amounts">
                  <span className="goal-saved" style={{ color: g.color }}>${g.saved.toLocaleString()}</span>
                  <span className="goal-of">of ${g.total.toLocaleString()}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                </div>
                <div className="goal-footer">
                  <span className="goal-pct" style={{ color: g.color }}>{pct}% complete</span>
                  <span className="goal-eta">~${g.monthly}/mo</span>
                </div>
              </BentoCard>
            )
          })}

          <BentoCard className="add-goal-card bento-card--glow" onClick={() => setShowModal(true)}>
            <div className="add-icon">＋</div>
            <div className="add-text">Add a new goal</div>
            <button className="add-inner-btn">Create Goal</button>
          </BentoCard>
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="modal-hd">🎯 New Goal<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="f-group"><label className="f-label">Goal Name</label><input className="f-input" placeholder="e.g. 🏖 Vacation" /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Target ($)</label><input className="f-input" type="number" placeholder="2000" /></div>
            <div className="f-group"><label className="f-label">Target Date</label><input className="f-input" type="month" /></div>
          </div>
          <div className="f-group"><label className="f-label">Monthly Contribution ($)</label><input className="f-input" type="number" placeholder="How much to save?" /></div>
          <button className="f-submit" style={{ background: 'linear-gradient(135deg,#0099b3,#00e5ff)', color: '#000' }}>Create Goal</button>
        </Modal>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;
  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }
  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #00e5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn { display: flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #0099b3, #00e5ff); border: none; border-radius: 12px; padding: 10px 18px; color: #000; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .add-btn:hover { opacity: 0.85; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 24px; }
  .stat-card { background: #060010; border: 1px solid #392e4e; border-radius: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
  .stat-card:hover { transform: translateY(-2px); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }
  .bento-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .goal-card { background: #060010; border: 1px solid #392e4e; border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; position: relative; animation: fadeUp 0.4s ease both; min-height: 260px; transition: transform 0.2s; }
  .goal-card:hover { transform: translateY(-3px); }
  .goal-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 20px 20px 0 0; }
  .goal-emoji { font-size: 34px; margin-top: 4px; }
  .goal-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; }
  .goal-target { font-size: 11.5px; color: rgba(255,255,255,0.38); }
  .goal-amounts { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
  .goal-saved { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; }
  .goal-of { font-size: 12px; color: rgba(255,255,255,0.38); }
  .bar-track { background: rgba(255,255,255,0.06); border-radius: 6px; height: 6px; overflow: hidden; }
  .bar-fill { height: 6px; border-radius: 6px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
  .goal-footer { display: flex; justify-content: space-between; align-items: center; }
  .goal-pct { font-size: 12px; font-weight: 700; }
  .goal-eta { font-size: 11px; color: rgba(255,255,255,0.38); }
  .add-goal-card { background: rgba(255,255,255,0.018); border: 1.5px dashed rgba(255,255,255,0.1); border-radius: 20px; padding: 22px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; cursor: pointer; transition: all 0.2s; text-align: center; gap: 12px; }
  .add-goal-card:hover { background: rgba(216,159,246,0.05); border-color: rgba(216,159,246,0.3); }
  .add-icon { font-size: 30px; opacity: 0.4; }
  .add-text { font-size: 13px; color: rgba(255,255,255,0.4); }
  .add-inner-btn { background: rgba(216,159,246,0.1); border: 1px solid rgba(216,159,246,0.25); border-radius: 20px; padding: 7px 18px; color: #D89FF6; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
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
  .f-input:focus,.f-sel:focus{border-color:rgba(0,229,255,0.4);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-sel option{background:#0d0020;}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .f-submit{width:100%;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit:hover{opacity:0.85;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

export default Savings