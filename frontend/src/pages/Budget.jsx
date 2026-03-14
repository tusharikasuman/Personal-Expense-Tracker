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

    const handleMouseEnter = () => {
      isHoveredRef.current = true
      animateParticles()
      gsap.to(element, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 })
    }
    const handleMouseLeave = () => {
      isHoveredRef.current = false
      clearAllParticles()
      gsap.to(element, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
    }
    const handleMouseMove = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      element.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`)
      element.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`)
      element.style.setProperty('--glow-intensity', '1')
      gsap.to(element, { rotateX: ((y - centerY) / centerY) * -10, rotateY: ((x - centerX) / centerX) * 10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 })
    }
    const handleClick = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height))
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:absolute;width:${maxDistance * 2}px;height:${maxDistance * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x - maxDistance}px;top:${y - maxDistance}px;pointer-events:none;z-index:1000;`
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
    <div
      ref={cardRef}
      className={className}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        '--glow-x': '50%',
        '--glow-y': '50%',
        '--glow-intensity': '0',
        '--glow-radius': '200px',
        '--glow-color': glowColor,
      }}
    >
      {children}
    </div>
  )
}

const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox>
  </ModalOverlay>
)

const Budget = () => {
  const [showModal, setShowModal] = useState(false)

  const stats = [
    { label: 'Total Budgeted', value: '$3,500', sub: 'for March 2026',      color: '#D89FF6', icon: '💰' },
    { label: 'Total Spent',    value: '$2,340', sub: '66.9% of budget used', color: '#ffaa00', icon: '📉' },
    { label: 'Remaining',      value: '$1,160', sub: '18 days left',         color: '#00ff87', icon: '🎯' },
    { label: 'Categories',     value: '6',      sub: 'active budgets',       color: '#00e5ff', icon: '📊' },
  ]

  const budgets = [
    { icon: '🛒', name: 'Food & Groceries', spent: 680,  limit: 1000, color: '#00ff87', status: 'On Track',   statusColor: 'green'  },
    { icon: '🚗', name: 'Transport',        spent: 270,  limit: 300,  color: '#ff6b6b', status: 'Near Limit', statusColor: 'red'    },
    { icon: '🎬', name: 'Entertainment',    spent: 100,  limit: 250,  color: '#00e5ff', status: 'On Track',   statusColor: 'cyan'   },
    { icon: '🛍️', name: 'Shopping',        spent: 525,  limit: 700,  color: '#ffaa00', status: 'Watch Out',  statusColor: 'orange' },
    { icon: '💊', name: 'Health',           spent: 60,   limit: 200,  color: '#D89FF6', status: 'On Track',   statusColor: 'purple' },
    { icon: '☕', name: 'Dining Out',       spent: 105,  limit: 250,  color: '#00ff87', status: 'On Track',   statusColor: 'green'  },
  ]

  const pillStyle = {
    green:  { background: 'rgba(0,255,135,0.08)',  color: '#00ff87', border: '1px solid rgba(0,255,135,0.2)'   },
    red:    { background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' },
    orange: { background: 'rgba(255,170,0,0.1)',   color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)'   },
    cyan:   { background: 'rgba(0,229,255,0.08)',  color: '#00e5ff', border: '1px solid rgba(0,229,255,0.15)'  },
    purple: { background: 'rgba(216,159,246,0.1)', color: '#D89FF6', border: '1px solid rgba(216,159,246,0.2)' },
  }

  const iconBg = {
    '#00ff87': 'rgba(0,255,135,0.1)',
    '#ff6b6b': 'rgba(255,107,107,0.1)',
    '#00e5ff': 'rgba(0,229,255,0.1)',
    '#ffaa00': 'rgba(255,170,0,0.1)',
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
            <h1 className="page-title">Budget</h1>
            <p className="page-sub">Set limits, track spending by category</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ New Budget</button>
        </div>

        {/* Stat cards */}
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
          <span>⚠️</span>
          <div><strong>Transport budget 90% used!</strong> You've spent $270 of $300 with 18 days remaining.</div>
        </div>

        {/* Budget bento grid */}
        <div className="bento-grid">
          {budgets.map((b, i) => {
            const pct = Math.round((b.spent / b.limit) * 100)
            return (
              <BentoCard key={i} className="budget-card bento-card--glow" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="bc-header">
                  <div className="bc-left">
                    <div className="bc-icon" style={{ background: iconBg[b.color] }}>{b.icon}</div>
                    <div>
                      <div className="bc-name">{b.name}</div>
                      <div className="bc-period">Monthly</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="pill" style={pillStyle[b.statusColor]}>{b.status}</span>
                    <button className="edit-btn">Edit</button>
                  </div>
                </div>
                <div className="bc-amounts">
                  <span className="bc-spent" style={{ color: b.color }}>${b.spent.toLocaleString()}</span>
                  <span className="bc-of">of ${b.limit.toLocaleString()}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: b.color }} />
                </div>
                <div className="bc-footer">
                  <span className="bc-pct" style={{ color: b.color }}>{pct}% used</span>
                  <span className="bc-rem">${(b.limit - b.spent).toLocaleString()} remaining</span>
                </div>
              </BentoCard>
            )
          })}
        </div>

      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="modal-hd">New Budget<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="f-group"><label className="f-label">Category</label>
            <select className="f-sel"><option>Food & Groceries</option><option>Transport</option><option>Entertainment</option><option>Shopping</option><option>Health</option><option>Housing</option></select>
          </div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Monthly Limit ($)</label><input className="f-input" type="number" placeholder="e.g. 500" /></div>
            <div className="f-group"><label className="f-label">Period</label><select className="f-sel"><option>Monthly</option><option>Weekly</option></select></div>
          </div>
          <button className="f-submit" style={{ background: 'linear-gradient(135deg,#b36200,#ffaa00)', color: '#000' }}>Create Budget</button>
        </Modal>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;
  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }
  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #ffaa00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn { display: flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #b36200, #ffaa00); border: none; border-radius: 12px; padding: 10px 18px; color: #000; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
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
  .bento-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .budget-card { background: #060010; border: 1px solid #392e4e; border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 14px; cursor: pointer; animation: fadeUp 0.4s ease both; transition: transform 0.2s; }
  .budget-card:hover { transform: translateY(-3px); }
  .bc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
  .bc-left { display: flex; align-items: center; gap: 10px; }
  .bc-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .bc-name { font-size: 14px; font-weight: 700; }
  .bc-period { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .bc-amounts { display: flex; justify-content: space-between; align-items: flex-end; }
  .bc-spent { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .bc-of { font-size: 12px; color: rgba(255,255,255,0.38); }
  .bar-track { background: rgba(255,255,255,0.06); border-radius: 6px; height: 7px; overflow: hidden; }
  .bar-fill { height: 7px; border-radius: 6px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
  .bc-footer { display: flex; justify-content: space-between; align-items: center; }
  .bc-pct { font-size: 12px; font-weight: 700; }
  .bc-rem { font-size: 11px; color: rgba(255,255,255,0.38); }
  .pill { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .edit-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 7px; padding: 4px 11px; color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .edit-btn:hover { background: rgba(255,255,255,0.09); color: white; }
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
  .f-input:focus,.f-sel:focus{border-color:rgba(255,170,0,0.4);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-sel option{background:#0d0020;}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .f-submit{width:100%;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit:hover{opacity:0.85;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

export default Budget