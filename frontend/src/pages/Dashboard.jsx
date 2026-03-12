import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import MagicBento from '../components/MagicBento'
import styled from 'styled-components'
import { gsap } from 'gsap'

// ── Reusable ParticleCard (same logic as MagicBento) ───────────────────────
const DEFAULT_GLOW_COLOR = '216, 159, 246'

const createParticle = (x, y, color) => {
  const el = document.createElement('div')
  el.style.cssText = `
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: rgba(${color}, 1); box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none; z-index: 100; left: ${x}px; top: ${y}px;
  `
  return el
}


const ParticleSection = ({ children, style, className, glowColor = DEFAULT_GLOW_COLOR }) => {
  const ref = useRef(null)
  const glowRef = useRef(null)
  const particlesRef = useRef([])
  const timeoutsRef = useRef([])
  const isHovered = useRef(false)
  const initialized = useRef(false)
  const memoized = useRef([])

  const init = useCallback(() => {
    if (initialized.current || !ref.current) return
    const { width, height } = ref.current.getBoundingClientRect()
    memoized.current = Array.from({ length: 10 }, () =>
      createParticle(Math.random() * width, Math.random() * height, glowColor)
    )
    initialized.current = true
  }, [glowColor])

  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    particlesRef.current.forEach(p => {
      gsap.to(p, {
        scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)',
        onComplete: () => p.parentNode?.removeChild(p)
      })
    })
    particlesRef.current = []
  }, [])

  const spawnParticles = useCallback(() => {
    if (!ref.current || !isHovered.current) return
    if (!initialized.current) init()
    memoized.current.forEach((particle, i) => {
      const id = setTimeout(() => {
        if (!isHovered.current || !ref.current) return
        const clone = particle.cloneNode(true)
        ref.current.appendChild(clone)
        particlesRef.current.push(clone)
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
        gsap.to(clone, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true })
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true })
      }, i * 80)
      timeoutsRef.current.push(id)
    })
  }, [init])

  useEffect(() => {
    const el = ref.current
    const glow = glowRef.current
    if (!el || !glow) return

    const onEnter = () => {
      isHovered.current = true
      spawnParticles()
      gsap.to(glow, { opacity: 1, duration: 0.3 })
      gsap.to(el, { boxShadow: `0 4px 30px rgba(124,58,237,0.25), 0 0 50px rgba(${glowColor},0.15)`, duration: 0.3 })
    }

    const onLeave = () => {
      isHovered.current = false
      clearParticles()
      gsap.to(glow, { opacity: 0, duration: 0.3 })
      gsap.to(el, { boxShadow: 'none', duration: 0.3 })
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' })
    }

    const onMove = e => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const xPct = (x / rect.width) * 100
      const yPct = (y / rect.height) * 100

      // move the glow to follow cursor
      glow.style.background = `radial-gradient(300px circle at ${xPct}% ${yPct}%,
        rgba(${glowColor}, 0.5) 0%,
        rgba(${glowColor}, 0.2) 30%,
        transparent 60%)`

      // tilt effect
      gsap.to(el, {
        rotateX: ((y - rect.height / 2) / rect.height) * -6,
        rotateY: ((x - rect.width / 2) / rect.width) * 6,
        duration: 0.15, ease: 'power2.out', transformPerspective: 1000
      })
    }

    const onClick = e => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const d = Math.max(
        Math.hypot(x, y), Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
      )
      const ripple = document.createElement('div')
      ripple.style.cssText = `
        position: absolute; width: ${d * 2}px; height: ${d * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor},0.4) 0%, rgba(${glowColor},0.15) 40%, transparent 70%);
        left: ${x - d}px; top: ${y - d}px;
        pointer-events: none; z-index: 50;
      `
      el.appendChild(ripple)
      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() }
      )
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('click', onClick)

    return () => {
      isHovered.current = false
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('click', onClick)
      clearParticles()
    }
  }, [spawnParticles, clearParticles, glowColor])

  return (
    <div ref={ref} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {/* Border glow overlay — real div, not ::after */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: `radial-gradient(300px circle at 50% 50%, rgba(${glowColor}, 0.5) 0%, transparent 60%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'opacity 0.3s'
        }}
      />
      {children}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      {children}
    </ModalBox>
  </ModalOverlay>
)

// ── Dashboard ──────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddBill, setShowAddBill] = useState(false)
  const [goalName, setGoalName]       = useState('')
  const [goalAmount, setGoalAmount]   = useState('')
  const [billName, setBillName]       = useState('')
  const [billDate, setBillDate]       = useState('')
  const [billAmount, setBillAmount]   = useState('')

  const [goals, setGoals] = useState([
    { name: '🏖 Vacation', saved: 1300, target: 2000 },
    { name: '💻 Laptop',   saved: 600,  target: 1500 },
  ])
  const [bills, setBills] = useState([
    { name: 'Rent',        due: 'Mar 15', amount: 1200 },
    { name: 'Electricity', due: 'Mar 18', amount: 85   },
    { name: 'Netflix',     due: 'Mar 22', amount: 15   },
  ])

  const transactions = [
    { name: 'Netflix',     date: 'Mar 12', amount: -15,    category: '🎬' },
    { name: 'Salary',      date: 'Mar 10', amount: 3200,   category: '💼' },
    { name: 'Groceries',   date: 'Mar 9',  amount: -84.50, category: '🛒' },
    { name: 'Freelance',   date: 'Mar 8',  amount: 500,    category: '💻' },
    { name: 'Electricity', date: 'Mar 7',  amount: -85,    category: '⚡' },
    { name: 'Gym',         date: 'Mar 6',  amount: -40,    category: '🏋️' },
  ]

  const budgets = [
    { name: 'Food',          pct: 68, color: '#00ff87' },
    { name: 'Transport',     pct: 90, color: '#ff6b6b' },
    { name: 'Entertainment', pct: 40, color: '#00e5ff' },
    { name: 'Shopping',      pct: 75, color: '#ffaa00' },
  ]

  const handleAddGoal = () => {
    if (!goalName || !goalAmount) return
    setGoals(prev => [...prev, { name: goalName, saved: 0, target: Number(goalAmount) }])
    setGoalName(''); setGoalAmount(''); setShowAddGoal(false)
  }

  const handleAddBill = () => {
    if (!billName || !billAmount) return
    setBills(prev => [...prev, { name: billName, due: billDate || 'TBD', amount: Number(billAmount) }])
    setBillName(''); setBillDate(''); setBillAmount(''); setShowAddBill(false)
  }

  return (
    <Wrapper>
      <Navbar />
      <div className="content">

        <div className="page-header">
          <h1 className="page-title">Good morning, Tusha 👋</h1>
          <p className="page-subtitle">Here's your financial overview for March 2026</p>
        </div>

        {/* ── MagicBento stat cards ── */}
        <div className="bento-wrapper">
          <MagicBento
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            glowColor="216, 159, 246"
            spotlightRadius={300}
            particleCount={12}
          />
        </div>

        {/* ── Big card: Transactions + Budget ── */}
        <ParticleSection className="big-card glow-card">
          <div className="big-card-section">
            <div className="section-header">
              <span className="section-title">🧾 Recent Transactions</span>
              <span className="section-link">View all →</span>
            </div>
            <div className="tx-list">
              {transactions.map((tx, i) => (
                <div className="tx-row" key={i}>
                  <div className="tx-left">
                    <div className="tx-icon">{tx.category}</div>
                    <div>
                      <div className="tx-name">{tx.name}</div>
                      <div className="tx-date">{tx.date}</div>
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.amount < 0 ? 'neg' : 'pos'}`}>
                    {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="big-card-section">
            <div className="section-header">
              <span className="section-title">📋 Budget Overview</span>
              <span className="section-link">Manage →</span>
            </div>
            <div className="budget-list">
              {budgets.map((b, i) => (
                <div className="budget-item" key={i}>
                  <div className="budget-label-row">
                    <span className="budget-name">{b.name}</span>
                    <span className="budget-pct" style={{ color: b.color }}>{b.pct}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                  {b.pct >= 85 && <div className="budget-warning">⚠️ Near limit!</div>}
                </div>
              ))}
            </div>
          </div>
        </ParticleSection>

        {/* ── Bottom row ── */}
        <div className="bottom-row">

          <ParticleSection className="bottom-card glow-card">
            <div className="section-header">
              <span className="section-title">🎯 Savings Goals</span>
              <button className="add-btn" onClick={() => setShowAddGoal(true)}>＋ Add Goal</button>
            </div>
            <div className="goals-list">
              {goals.map((g, i) => {
                const pct = Math.round((g.saved / g.target) * 100)
                return (
                  <div className="goal-item" key={i}>
                    <div className="goal-label-row">
                      <span className="goal-name">{g.name}</span>
                      <span className="goal-meta">${g.saved.toLocaleString()} / ${g.target.toLocaleString()}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #D89FF6)' }} />
                    </div>
                    <div className="goal-pct">{pct}% complete</div>
                  </div>
                )
              })}
            </div>
          </ParticleSection>

          <ParticleSection className="bottom-card glow-card">
            <div className="section-header">
              <span className="section-title">📅 Upcoming Bills</span>
              <button className="add-btn" onClick={() => setShowAddBill(true)}>＋ Add Bill</button>
            </div>
            <div className="bills-list">
              {bills.map((b, i) => (
                <div className="bill-row" key={i}>
                  <div className="bill-left">
                    <div className="bill-name">{b.name}</div>
                    <div className="bill-due">Due {b.due}</div>
                  </div>
                  <div className="bill-amount">${b.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </ParticleSection>

        </div>
      </div>

      {/* ── Modals ── */}
      {showAddGoal && (
        <Modal title="🎯 Add Savings Goal" onClose={() => setShowAddGoal(false)}>
          <div className="modal-form">
            <input className="modal-input" placeholder="Goal name (e.g. 🏖 Vacation)" value={goalName} onChange={e => setGoalName(e.target.value)} />
            <input className="modal-input" placeholder="Target amount ($)" type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} />
            <button className="modal-submit" onClick={handleAddGoal}>Add Goal</button>
          </div>
        </Modal>
      )}

      {showAddBill && (
        <Modal title="📅 Add Upcoming Bill" onClose={() => setShowAddBill(false)}>
          <div className="modal-form">
            <input className="modal-input" placeholder="Bill name (e.g. Rent)" value={billName} onChange={e => setBillName(e.target.value)} />
            <input className="modal-input" placeholder="Due date (e.g. Mar 25)" value={billDate} onChange={e => setBillDate(e.target.value)} />
            <input className="modal-input" placeholder="Amount ($)" type="number" value={billAmount} onChange={e => setBillAmount(e.target.value)} />
            <button className="modal-submit" onClick={handleAddBill}>Add Bill</button>
          </div>
        </Modal>
      )}

    </Wrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const Wrapper = styled.div`
  min-height: 100vh;
  color: white;
  font-family: 'DM Sans', sans-serif;

  .content {
    padding: 100px 32px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .page-header { text-align: center; }
  .page-title {
    font-size: 28px; font-weight: 800; margin: 0 0 6px;
    background: linear-gradient(135deg, #ffffff, #D89FF6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .page-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin: 0; }

  .bento-wrapper { display: flex; justify-content: center; width: 100%; }

  /* glow border effect on hover */
  .glow-card {
    --glow-x: 50%;
    --glow-y: 50%;
    --glow-intensity: 0;
    --glow-radius: 250px;
  }
  .glow-card::after {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    background: radial-gradient(
      var(--glow-radius) circle at var(--glow-x) var(--glow-y),
      rgba(216,159,246, calc(var(--glow-intensity) * 0.9)) 0%,
      rgba(216,159,246, calc(var(--glow-intensity) * 0.4)) 30%,
      transparent 60%
    );
    border-radius: inherit;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
    transition: opacity 0.3s;
  }
  .glow-card:hover {
    box-shadow: 0 4px 30px rgba(124,58,237,0.2), 0 0 40px rgba(216,159,246,0.1);
  }

  /* big card */
  .big-card {
    display: flex;
    gap: 0;
    padding: 0;
    background: rgba(255,255,255,0.03);
    border: 1px solid #392e4e;
    border-radius: 20px;
    width: 100%;
    overflow: hidden;
  }
  .big-card-section { flex: 1; padding: 24px; }
  .divider { width: 1px; background: rgba(255,255,255,0.06); flex-shrink: 0; }

  /* section header */
  .section-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px;
  }
  .section-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
  .section-link { font-size: 12px; color: #D89FF6; cursor: pointer; opacity: 0.8; }
  .section-link:hover { opacity: 1; }

  /* transactions */
  .tx-list { display: flex; flex-direction: column; gap: 4px; }
  .tx-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-radius: 10px; transition: background 0.2s;
  }
  .tx-row:hover { background: rgba(255,255,255,0.04); }
  .tx-left { display: flex; align-items: center; gap: 12px; }
  .tx-icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .tx-name { font-size: 13px; font-weight: 600; color: white; }
  .tx-date { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .tx-amount { font-size: 13px; font-weight: 700; }
  .tx-amount.neg { color: #ff6b6b; }
  .tx-amount.pos { color: #00ff87; }

  /* budget */
  .budget-list { display: flex; flex-direction: column; gap: 18px; }
  .budget-label-row { display: flex; justify-content: space-between; margin-bottom: 7px; }
  .budget-name { font-size: 13px; color: rgba(255,255,255,0.75); }
  .budget-pct { font-size: 12px; font-weight: 700; }
  .budget-warning { font-size: 11px; color: #ff6b6b; margin-top: 4px; }

  /* bars */
  .bar-track { background: rgba(255,255,255,0.07); border-radius: 6px; height: 6px; overflow: hidden; }
  .bar-fill { height: 6px; border-radius: 6px; transition: width 0.6s ease; }

  /* bottom row */
  .bottom-row { display: flex; gap: 16px; width: 100%; }
  .bottom-card {
    flex: 1; padding: 24px;
    background: rgba(255,255,255,0.03);
    border: 1px solid #392e4e;
    border-radius: 20px;
  }

  /* goals */
  .goals-list { display: flex; flex-direction: column; gap: 16px; }
  .goal-label-row { display: flex; justify-content: space-between; margin-bottom: 7px; }
  .goal-name { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; }
  .goal-meta { font-size: 11px; color: rgba(255,255,255,0.4); }
  .goal-pct { font-size: 11px; color: #D89FF6; margin-top: 5px; }

  /* bills */
  .bills-list { display: flex; flex-direction: column; gap: 4px; }
  .bill-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-radius: 10px; transition: background 0.2s;
  }
  .bill-row:hover { background: rgba(255,255,255,0.04); }
  .bill-name { font-size: 13px; font-weight: 600; color: white; }
  .bill-due { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .bill-amount { font-size: 13px; font-weight: 700; color: #ffaa00; }

  /* add button */
  .add-btn {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(216,159,246,0.1); border: 1px solid rgba(216,159,246,0.25);
    border-radius: 20px; padding: 5px 14px;
    color: #D89FF6; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .add-btn:hover { background: rgba(216,159,246,0.2); border-color: rgba(216,159,246,0.4); }
`

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
`

const ModalBox = styled.div`
  background: #12001f; border: 1px solid #392e4e;
  border-radius: 20px; padding: 28px; width: 380px;
  font-family: 'DM Sans', sans-serif;

  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px;
    h3 { color: white; font-size: 16px; font-weight: 700; }
  }
  .close-btn {
    background: rgba(255,255,255,0.07); border: none; color: rgba(255,255,255,0.6);
    width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
    font-size: 13px; display: flex; align-items: center; justify-content: center;
  }
  .close-btn:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }

  .modal-form { display: flex; flex-direction: column; gap: 12px; }
  .modal-input {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 12px 14px; color: white;
    font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .modal-input:focus { border-color: rgba(216,159,246,0.5); }
  .modal-input::placeholder { color: rgba(255,255,255,0.3); }
  .modal-submit {
    background: linear-gradient(135deg, #7c3aed, #D89FF6);
    border: none; border-radius: 10px; padding: 12px;
    color: white; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .modal-submit:hover { opacity: 0.85; }
`

export default Dashboard