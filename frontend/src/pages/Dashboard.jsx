import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'
import API from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'

// ── Particle Card ──────────────────────────────────────────────────────────
const DEFAULT_GLOW = '216, 159, 246'
const createParticle = (x, y, color) => {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`
  return el
}
const ParticleCard = ({ children, style, className, glowColor = DEFAULT_GLOW }) => {
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
    memoized.current = Array.from({ length: 10 }, () => createParticle(Math.random() * width, Math.random() * height, glowColor))
    initialized.current = true
  }, [glowColor])
  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []
    particlesRef.current.forEach(p => { gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) }) })
    particlesRef.current = []
  }, [])
  const spawnParticles = useCallback(() => {
    if (!ref.current || !isHovered.current) return
    if (!initialized.current) init()
    memoized.current.forEach((particle, i) => {
      const id = setTimeout(() => {
        if (!isHovered.current || !ref.current) return
        const clone = particle.cloneNode(true)
        ref.current.appendChild(clone); particlesRef.current.push(clone)
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
        gsap.to(clone, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true })
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true })
      }, i * 80)
      timeoutsRef.current.push(id)
    })
  }, [init])
  useEffect(() => {
    const el = ref.current; const glow = glowRef.current
    if (!el || !glow) return
    const onEnter = () => { isHovered.current = true; spawnParticles(); gsap.to(glow, { opacity: 1, duration: 0.3 }); gsap.to(el, { boxShadow: `0 4px 30px rgba(124,58,237,0.2),0 0 50px rgba(${glowColor},0.1)`, duration: 0.3 }) }
    const onLeave = () => { isHovered.current = false; clearParticles(); gsap.to(glow, { opacity: 0, duration: 0.3 }); gsap.to(el, { boxShadow: 'none', rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' }) }
    const onMove = e => {
      const rect = el.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top
      glow.style.background = `radial-gradient(280px circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(${glowColor},0.5) 0%, rgba(${glowColor},0.15) 40%, transparent 65%)`
      gsap.to(el, { rotateX: ((y - rect.height / 2) / rect.height) * -6, rotateY: ((x - rect.width / 2) / rect.width) * 6, duration: 0.15, ease: 'power2.out', transformPerspective: 1000 })
    }
    const onClick = e => {
      const rect = el.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top
      const d = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height))
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:absolute;width:${d * 2}px;height:${d * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.15) 40%,transparent 70%);left:${x - d}px;top:${y - d}px;pointer-events:none;z-index:50;`
      el.appendChild(ripple); gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() })
    }
    el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); el.addEventListener('mousemove', onMove); el.addEventListener('click', onClick)
    return () => { isHovered.current = false; el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); el.removeEventListener('mousemove', onMove); el.removeEventListener('click', onClick); clearParticles() }
  }, [spawnParticles, clearParticles, glowColor])
  return (
    <div ref={ref} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <div ref={glowRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', padding: '1px', background: `radial-gradient(280px circle at 50% 50%, rgba(${glowColor},0.5) 0%, transparent 65%)`, WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', opacity: 0, pointerEvents: 'none', zIndex: 10 }} />
      {children}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox>
  </ModalOverlay>
)

// ── Dashboard ──────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState(null)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets]           = useState([])
  const [goals, setGoals]               = useState([])
  const [bills, setBills]               = useState([])
  const [showAddGoal, setShowAddGoal]   = useState(false)
  const [showAddBill, setShowAddBill]   = useState(false)
  const [goalForm, setGoalForm]         = useState({ name: '', target_amount: '' })
  const [billForm, setBillForm]         = useState({ name: '', amount: '', due_date: '' })

  // ── Fetch all dashboard data ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const now   = new Date()
        const month = now.getMonth() + 1
        const year  = now.getFullYear()
const [dashRes, expRes, budRes, goalRes, billRes] = await Promise.all([
  API.get(`/dashboard?month=${month}&year=${year}`),
  API.get('/expenses?limit=6'),
  API.get('/budget'),
  API.get('/savings-goals'),
  API.get('/wallet/transactions?limit=5'),
])

const dash = dashRes.data

setStats({
  total_balance: dash.summary.wallet_balance,
  total_income: dash.summary.total_income,
  total_expenses: dash.summary.total_expenses,
  total_savings: dash.summary.total_savings
})

setTransactions(dash.recent_expenses || [])
setBudgets(dash.budget_comparison || [])
setGoals(dash.savings_goals || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Add goal ──
  const handleAddGoal = async () => {
    if (!goalForm.name || !goalForm.target_amount) return
    try {
      const res = await API.post('/savings-goals', {
        name:          goalForm.name,
        target_amount: Number(goalForm.target_amount)
      })
      setGoals(prev => [...prev, res.data?.goal || res.data])
      setGoalForm({ name: '', target_amount: '' })
      setShowAddGoal(false)
    } catch (err) { console.error(err) }
  }

  // ── Add bill ──
  const handleAddBill = async () => {
    if (!billForm.name || !billForm.amount) return
    try {
      const res = await API.post('/wallet/pay-bill', {
        name:     billForm.name,
        amount:   Number(billForm.amount),
        due_date: billForm.due_date
      })
      setBills(prev => [...prev, res.data?.bill || res.data])
      setBillForm({ name: '', amount: '', due_date: '' })
      setShowAddBill(false)
    } catch (err) { console.error(err) }
  }

  // ── Greeting ──
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statCards = stats ? [
    { label: 'Total Balance',  value: `$${fmt(stats.total_balance)}`,  sub: 'Current balance',        color: '#D89FF6', icon: '💰' },
    { label: 'Total Income',   value: `$${fmt(stats.total_income)}`,   sub: 'This month',             color: '#00ff87', icon: '📈' },
    { label: 'Total Expenses', value: `$${fmt(stats.total_expenses)}`, sub: 'This month',             color: '#ff6b6b', icon: '📉' },
    { label: 'Total Savings',  value: `$${fmt(stats.total_savings)}`,  sub: 'Saved so far',           color: '#00e5ff', icon: '🎯' },
  ] : [
    { label: 'Total Balance',  value: '—', sub: 'Loading...', color: '#D89FF6', icon: '💰' },
    { label: 'Total Income',   value: '—', sub: 'Loading...', color: '#00ff87', icon: '📈' },
    { label: 'Total Expenses', value: '—', sub: 'Loading...', color: '#ff6b6b', icon: '📉' },
    { label: 'Total Savings',  value: '—', sub: 'Loading...', color: '#00e5ff', icon: '🎯' },
  ]

  const getCatIcon = (name) => {
    const n = (name || '').toLowerCase()
    if (n.includes('food') || n.includes('grocer')) return '🛒'
    if (n.includes('transport')) return '🚗'
    if (n.includes('entertainment')) return '🎬'
    if (n.includes('health')) return '💊'
    if (n.includes('housing') || n.includes('rent')) return '🏠'
    if (n.includes('electric') || n.includes('util')) return '⚡'
    if (n.includes('gym')) return '🏋️'
    return '💳'
  }

  if (loading) return (
    <Wrapper>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
        Loading your dashboard...
      </div>
    </Wrapper>
  )

  return (
    <Wrapper>
      <Navbar />
      <div className="page">

        {/* Greeting */}
        <div className="page-header">
          <h1 className="page-title">{getGreeting()}, {user?.firstname || 'there'} 👋</h1>
          <p className="page-subtitle">Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid">
          {statCards.map((s, i) => (
            <ParticleCard key={i} className="stat-card">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color: s.color }}>{s.sub}</div>
            </ParticleCard>
          ))}
        </div>

        {/* Big card — Transactions + Budget */}
        <ParticleCard className="big-card">
          {/* Recent Transactions */}
          <div className="big-section">
            <div className="section-head">
              <span className="section-title">🧾 Recent Transactions</span>
              <span className="section-link" onClick={() => window.location.href = '/expenses'}>View all →</span>
            </div>
            {transactions.length === 0 ? (
              <div className="empty">No transactions yet</div>
            ) : (
              <div className="tx-list">
                {transactions.map((tx, i) => (
                  <div className="tx-row" key={i}>
                    <div className="tx-left">
                      <div className="tx-ico">{getCatIcon(tx.category_name)}</div>
                      <div>
                        <div className="tx-name">{tx.description || tx.name || 'Transaction'}</div>
                        <div className="tx-date">{tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                      </div>
                    </div>
                    <div className="tx-amt-neg">−${fmt(tx.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Budget Overview */}
          <div className="big-section">
            <div className="section-head">
              <span className="section-title">📋 Budget Overview</span>
              <span className="section-link" onClick={() => window.location.href = '/budget'}>Manage →</span>
            </div>
            {budgets.length === 0 ? (
              <div className="empty">No budgets set yet</div>
            ) : (
              <div className="budget-list">
                {budgets.slice(0, 4).map((b, i) => {
                  const pct  = Math.min(Math.round((Number(b.spent || 0) / Number(b.amount || 1)) * 100), 100)
                  const color = pct >= 85 ? '#ff6b6b' : pct >= 65 ? '#ffaa00' : '#00ff87'
                  return (
                    <div className="budget-item" key={i}>
                      <div className="budget-row">
                        <span className="budget-name">{b.category_name || b.name}</span>
                        <span className="budget-pct" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      {pct >= 85 && <div className="budget-warn">⚠️ Near limit!</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ParticleCard>

        {/* Bottom row */}
        <div className="bottom-row">

          {/* Savings Goals */}
          <ParticleCard className="bottom-card">
            <div className="section-head">
              <span className="section-title">🎯 Savings Goals</span>
              <button className="add-btn" onClick={() => setShowAddGoal(true)}>＋ Add Goal</button>
            </div>
            {goals.length === 0 ? (
              <div className="empty">No savings goals yet</div>
            ) : (
              <div className="goals-list">
                {goals.map((g, i) => {
                  const saved = Number(g.current_amount || g.saved || 0)
                  const total = Number(g.target_amount  || g.target || 1)
                  const pct   = Math.round((saved / total) * 100)
                  return (
                    <div className="goal-item" key={i}>
                      <div className="budget-row">
                        <span className="budget-name">{g.name}</span>
                        <span className="budget-name" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>${saved.toLocaleString()} / ${total.toLocaleString()}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#7c3aed,#D89FF6)' }} />
                      </div>
                      <div className="goal-pct">{pct}% complete</div>
                    </div>
                  )
                })}
              </div>
            )}
          </ParticleCard>

          {/* Upcoming Bills */}
          <ParticleCard className="bottom-card">
            <div className="section-head">
              <span className="section-title">📅 Upcoming Bills</span>
              <button className="add-btn" onClick={() => setShowAddBill(true)}>＋ Add Bill</button>
            </div>
            {bills.length === 0 ? (
              <div className="empty">No upcoming bills</div>
            ) : (
              <div className="bills-list">
                {bills.map((b, i) => (
                  <div className="bill-row" key={i}>
                    <div>
                      <div className="tx-name">{b.description || b.name}</div>
                      <div className="tx-date">{b.due_date ? `Due ${new Date(b.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                    </div>
                    <div className="bill-amt">${fmt(b.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </ParticleCard>

        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <Modal onClose={() => setShowAddGoal(false)}>
          <div className="modal-hd">🎯 Add Savings Goal<button className="x-btn" onClick={() => setShowAddGoal(false)}>✕</button></div>
          <div className="f-group"><label className="f-label">Goal Name</label><input className="f-input" placeholder="e.g. 🏖 Vacation" value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} /></div>
          <div className="f-group"><label className="f-label">Target Amount ($)</label><input className="f-input" type="number" placeholder="e.g. 2000" value={goalForm.target_amount} onChange={e => setGoalForm({ ...goalForm, target_amount: e.target.value })} /></div>
          <button className="f-submit" onClick={handleAddGoal}>Add Goal</button>
        </Modal>
      )}

      {/* Add Bill Modal */}
      {showAddBill && (
        <Modal onClose={() => setShowAddBill(false)}>
          <div className="modal-hd">📅 Add Bill<button className="x-btn" onClick={() => setShowAddBill(false)}>✕</button></div>
          <div className="f-group"><label className="f-label">Bill Name</label><input className="f-input" placeholder="e.g. Rent" value={billForm.name} onChange={e => setBillForm({ ...billForm, name: e.target.value })} /></div>
          <div className="f-group"><label className="f-label">Amount ($)</label><input className="f-input" type="number" placeholder="0.00" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })} /></div>
          <div className="f-group"><label className="f-label">Due Date</label><input className="f-input" type="date" value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })} /></div>
          <button className="f-submit" onClick={handleAddBill}>Add Bill</button>
        </Modal>
      )}

    </Wrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;

  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }
  .page-header { text-align: center; margin-bottom: 28px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #D89FF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px; }
  .page-subtitle { font-size: 13px; color: rgba(255,255,255,0.38); }

  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 20px; }
  .stat-card { background: #060010; border: 1px solid #392e4e; border-radius: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
  .stat-card:hover { transform: translateY(-2px); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }

  .big-card { display: flex; gap: 0; padding: 0; background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 20px; width: 100%; overflow: hidden; margin-bottom: 20px; }
  .big-section { flex: 1; padding: 24px; }
  .divider { width: 1px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
  .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.6px; }
  .section-link { font-size: 12px; color: #D89FF6; cursor: pointer; opacity: 0.8; }
  .section-link:hover { opacity: 1; }

  .tx-list { display: flex; flex-direction: column; gap: 4px; }
  .tx-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 10px; border-radius: 10px; transition: background 0.18s; cursor: pointer; }
  .tx-row:hover { background: rgba(255,255,255,0.03); }
  .tx-left { display: flex; align-items: center; gap: 11px; }
  .tx-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.055); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .tx-name { font-size: 13px; font-weight: 600; }
  .tx-date { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .tx-amt-neg { font-size: 13px; font-weight: 700; color: #ff6b6b; }
  .tx-amt-pos { font-size: 13px; font-weight: 700; color: #00ff87; }

  .budget-list { display: flex; flex-direction: column; gap: 16px; }
  .budget-item {}
  .budget-row { display: flex; justify-content: space-between; margin-bottom: 7px; }
  .budget-name { font-size: 13px; color: rgba(255,255,255,0.75); }
  .budget-pct { font-size: 12px; font-weight: 700; }
  .budget-warn { font-size: 11px; color: #ff6b6b; margin-top: 4px; }
  .bar-track { background: rgba(255,255,255,0.07); border-radius: 6px; height: 6px; overflow: hidden; }
  .bar-fill { height: 6px; border-radius: 6px; transition: width 0.6s ease; }

  .bottom-row { display: flex; gap: 16px; }
  .bottom-card { flex: 1; padding: 24px; background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 20px; }
  .add-btn { display: inline-flex; align-items: center; gap: 4px; background: rgba(216,159,246,0.1); border: 1px solid rgba(216,159,246,0.25); border-radius: 20px; padding: 5px 14px; color: #D89FF6; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .add-btn:hover { background: rgba(216,159,246,0.2); }

  .goals-list { display: flex; flex-direction: column; gap: 16px; }
  .goal-item {}
  .goal-pct { font-size: 11px; color: #D89FF6; margin-top: 5px; }

  .bills-list { display: flex; flex-direction: column; gap: 4px; }
  .bill-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 10px; border-radius: 10px; transition: background 0.18s; }
  .bill-row:hover { background: rgba(255,255,255,0.03); }
  .bill-amt { font-size: 13px; font-weight: 700; color: #ffaa00; }

  .empty { font-size: 13px; color: rgba(255,255,255,0.25); text-align: center; padding: 24px 0; }
`

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,0.72); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center;
`
const ModalBox = styled.div`
  background: #0d0020; border: 1px solid #281a44; border-radius: 22px; padding: 30px; width: 420px; font-family: 'DM Sans', sans-serif; animation: modalIn 0.28s ease;
  .modal-hd { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; color: white; }
  .x-btn { background: rgba(255,255,255,0.07); border: none; color: rgba(255,255,255,0.4); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 13px; }
  .x-btn:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
  .f-group { margin-bottom: 14px; }
  .f-label { display: block; font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 7px; }
  .f-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 11px 13px; color: white; font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s; }
  .f-input:focus { border-color: rgba(216,159,246,0.45); }
  .f-input::placeholder { color: rgba(255,255,255,0.3); }
  .f-submit { width: 100%; background: linear-gradient(135deg, #7c3aed, #D89FF6); border: none; border-radius: 11px; padding: 12px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 6px; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .f-submit:hover { opacity: 0.85; }
  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`

export default Dashboard