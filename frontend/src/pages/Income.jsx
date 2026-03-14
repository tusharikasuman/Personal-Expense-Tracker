import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'

// ── Particle Card (same as Expenses) ──────────────────────────────────────
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
    memoized.current = Array.from({ length: 10 }, () =>
      createParticle(Math.random() * width, Math.random() * height, glowColor)
    )
    initialized.current = true
  }, [glowColor])

  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    particlesRef.current.forEach(p => {
      gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) })
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
      gsap.to(el, { boxShadow: `0 4px 30px rgba(124,58,237,0.2), 0 0 50px rgba(${glowColor},0.1)`, duration: 0.3 })
    }
    const onLeave = () => {
      isHovered.current = false
      clearParticles()
      gsap.to(glow, { opacity: 0, duration: 0.3 })
      gsap.to(el, { boxShadow: 'none', rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' })
    }
    const onMove = e => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      glow.style.background = `radial-gradient(280px circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(${glowColor},0.5) 0%, rgba(${glowColor},0.15) 40%, transparent 65%)`
      gsap.to(el, { rotateX: ((y - rect.height / 2) / rect.height) * -6, rotateY: ((x - rect.width / 2) / rect.width) * 6, duration: 0.15, ease: 'power2.out', transformPerspective: 1000 })
    }
    const onClick = e => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const d = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height))
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:absolute;width:${d * 2}px;height:${d * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.15) 40%,transparent 70%);left:${x - d}px;top:${y - d}px;pointer-events:none;z-index:50;`
      el.appendChild(ripple)
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() })
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
      <div ref={glowRef} style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', padding: '1px',
        background: `radial-gradient(280px circle at 50% 50%, rgba(${glowColor},0.5) 0%, transparent 65%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
        opacity: 0, pointerEvents: 'none', zIndex: 10
      }} />
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

// ── Income Page ────────────────────────────────────────────────────────────
const Income = () => {
  const [showModal, setShowModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  const filters = ['All', 'Salary', 'Freelance', 'Passive', 'Gifts']

  const stats = [
    { label: 'This Month',     value: '$5,200', sub: '↑ 12% vs last month', color: '#00ff87', icon: '📈' },
    { label: 'Primary Salary', value: '$3,200', sub: 'Fixed monthly',        color: 'white',   icon: '💼' },
    { label: 'Freelance',      value: '$1,500', sub: '↑ 3 projects',         color: '#00e5ff', icon: '💻' },
    { label: 'Passive',        value: '$500',   sub: 'Dividends',            color: '#D89FF6', icon: '📦' },
  ]

  const sources = [
    { icon: '💼', name: 'Monthly Salary',     desc: 'Tech Corp Ltd. · Recurring', type: 'Salary',   typeColor: 'green',  date: 'Mar 10', amount: 3200  },
    { icon: '💻', name: 'Freelance — Web Dev', desc: 'Client project',             type: 'Freelance', typeColor: 'cyan',   date: 'Mar 8',  amount: 1000  },
    { icon: '🎨', name: 'Freelance — UI',      desc: 'Startup project',            type: 'Freelance', typeColor: 'cyan',   date: 'Mar 5',  amount: 500   },
    { icon: '📦', name: 'Dividend Payout',     desc: 'Mutual fund returns',        type: 'Passive',   typeColor: 'orange', date: 'Mar 1',  amount: 500   },
  ]

  const filtered = activeFilter === 'All' ? sources : sources.filter(s => s.type === activeFilter)

  const typeStyle = {
    green:  { background: 'rgba(0,255,135,0.08)',  color: '#00ff87', border: '1px solid rgba(0,255,135,0.15)'  },
    cyan:   { background: 'rgba(0,229,255,0.08)',  color: '#00e5ff', border: '1px solid rgba(0,229,255,0.15)'  },
    orange: { background: 'rgba(255,170,0,0.1)',   color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)'   },
    purple: { background: 'rgba(216,159,246,0.1)', color: '#D89FF6', border: '1px solid rgba(216,159,246,0.2)' },
  }

  // donut segments
  const breakdown = [
    { label: 'Salary',    pct: 61.5, color: '#00ff87' },
    { label: 'Freelance', pct: 28.8, color: '#D89FF6' },
    { label: 'Passive',   pct: 9.6,  color: '#ffaa00' },
  ]

  return (
    <Wrapper>
      <Navbar />
      <div className="page">

        {/* Header */}
        <div className="page-head">
          <div>
            <h1 className="page-title">Income</h1>
            <p className="page-sub">All your earning sources in one place</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ Add Income</button>
        </div>

        {/* Bento stat cards */}
        <div className="stat-grid">
          {stats.map((s, i) => (
            <ParticleCard key={i} className="stat-card">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color: s.color === 'white' ? 'rgba(255,255,255,0.4)' : s.color }}>{s.sub}</div>
            </ParticleCard>
          ))}
        </div>

        {/* Two col — sources + breakdown */}
        <div className="two-col">

          {/* Income sources */}
          <ParticleCard className="card">
            <div className="card-title">
              <span>💰 Income Sources</span>
              <span className="card-link">View all →</span>
            </div>
            <div className="sources-list">
              {sources.map((s, i) => (
                <div className="source-row" key={i}>
                  <div className="source-left">
                    <div className="source-ico" style={{ background: `rgba(${s.typeColor === 'green' ? '0,255,135' : s.typeColor === 'cyan' ? '0,229,255' : '255,170,0'},0.08)` }}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="source-name">{s.name}</div>
                      <div className="source-desc">{s.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="source-amt">+${s.amount.toLocaleString()}.00</div>
                    <div className="source-date">{s.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </ParticleCard>

          {/* Breakdown donut */}
          <ParticleCard className="card">
            <div className="card-title"><span>📊 Breakdown</span></div>
            <div className="donut-wrap">
              <div className="donut-ring">
                <div className="donut-center">
                  <div className="donut-val">$5,200</div>
                  <div className="donut-lbl">Total</div>
                </div>
              </div>
              <div className="legend">
                {breakdown.map((b, i) => (
                  <div className="legend-row" key={i}>
                    <div className="legend-left">
                      <div className="dot" style={{ background: b.color }} />
                      <span>{b.label}</span>
                    </div>
                    <span className="legend-pct">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ParticleCard>

        </div>

        {/* Filters */}
        <div className="filters">
          {filters.map(f => (
            <button key={f} className={`f-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Table */}
        <ParticleCard className="tbl">
          <div className="tbl-head">
            <div className="tbl-th">Source</div>
            <div className="tbl-th">Type</div>
            <div className="tbl-th">Date</div>
            <div className="tbl-th">Amount</div>
          </div>
          {filtered.map((s, i) => (
            <div className="tbl-row" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="tx-wrap">
                <div className="tx-ico">{s.icon}</div>
                <div>
                  <div className="tx-name">{s.name}</div>
                  <div className="tx-desc">{s.desc}</div>
                </div>
              </div>
              <div><span className="pill" style={typeStyle[s.typeColor]}>{s.type}</span></div>
              <div className="dt">{s.date}</div>
              <div className="amt-pos">+${s.amount.toLocaleString()}.00</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              No income found
            </div>
          )}
        </ParticleCard>

      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="modal-hd">
            Add Income
            <button className="x-btn" onClick={() => setShowModal(false)}>✕</button>
          </div>
          <div className="f-group">
            <label className="f-label">Source / Description</label>
            <input className="f-input" placeholder="e.g. Monthly Salary" />
          </div>
          <div className="f-row">
            <div className="f-group">
              <label className="f-label">Amount ($)</label>
              <input className="f-input" type="number" placeholder="0.00" />
            </div>
            <div className="f-group">
              <label className="f-label">Date</label>
              <input className="f-input" type="date" />
            </div>
          </div>
          <div className="f-group">
            <label className="f-label">Type</label>
            <select className="f-sel">
              <option>Salary</option>
              <option>Freelance</option>
              <option>Passive</option>
              <option>Gift</option>
              <option>Other</option>
            </select>
          </div>
          <button className="f-submit" style={{ background: 'linear-gradient(135deg,#00a855,#00ff87)', color: '#000' }}>
            Add Income
          </button>
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

  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }

  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    background: linear-gradient(135deg, #fff, #00ff87);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn {
    display: flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #00a855, #00ff87);
    border: none; border-radius: 12px; padding: 10px 18px;
    color: #000; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
  }
  .add-btn:hover { opacity: 0.85; }

  /* stat grid */
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 24px; }
  .stat-card {
    background: rgba(14,6,28,0.85); border: 1px solid #1e1530;
    border-radius: 16px; padding: 20px;
    transition: transform 0.2s, border-color 0.3s; cursor: pointer;
  }
  .stat-card:hover { transform: translateY(-2px); border-color: rgba(0,255,135,0.2); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }

  /* two col */
  .two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 18px; }
  .card {
    background: rgba(14,6,28,0.85); border: 1px solid #1e1530;
    border-radius: 20px; padding: 22px;
  }
  .card-title {
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55);
    text-transform: uppercase; letter-spacing: 0.6px;
    margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;
  }
  .card-link { font-size: 12px; color: #D89FF6; cursor: pointer; opacity: 0.8; font-weight: 500; }
  .card-link:hover { opacity: 1; }

  /* sources */
  .sources-list { display: flex; flex-direction: column; }
  .source-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.2s;
  }
  .source-row:last-child { border-bottom: none; }
  .source-left { display: flex; align-items: center; gap: 11px; }
  .source-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .source-name { font-size: 13px; font-weight: 600; }
  .source-desc { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .source-amt { font-size: 13px; font-weight: 700; color: #00ff87; }
  .source-date { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }

  /* donut */
  .donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 10px 0; }
  .donut-ring {
    width: 150px; height: 150px; border-radius: 50%; position: relative;
    background: conic-gradient(#00ff87 0deg 221deg, #D89FF6 221deg 325deg, #ffaa00 325deg 360deg);
  }
  .donut-ring::after { content:''; position:absolute; inset:32px; background: rgba(14,6,28,1); border-radius:50%; }
  .donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:1; }
  .donut-val { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; }
  .donut-lbl { font-size:10px; color:rgba(255,255,255,0.4); }
  .legend { display:flex; flex-direction:column; gap:10px; width:100%; max-width:170px; }
  .legend-row { display:flex; align-items:center; justify-content:space-between; font-size:12px; }
  .legend-left { display:flex; align-items:center; gap:8px; color:rgba(255,255,255,0.7); }
  .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .legend-pct { color:rgba(255,255,255,0.4); font-weight:600; }

  /* filters */
  .filters { display: flex; gap: 8px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  .f-btn {
    padding: 6px 14px; border-radius: 50px;
    border: 1px solid #1e1530; background: transparent;
    color: rgba(255,255,255,0.38); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .f-btn.active, .f-btn:hover { background: rgba(0,255,135,0.08); color: #00ff87; border-color: rgba(0,255,135,0.25); }

  /* table */
  .tbl { background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 18px; overflow: hidden; }
  .tbl-head { display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .tbl-th { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.5px; }
  .tbl-row {
    display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr;
    padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.03);
    align-items: center; transition: background 0.18s; cursor: pointer;
    animation: fadeUp 0.4s ease both;
  }
  .tbl-row:hover { background: rgba(255,255,255,0.025); }
  .tbl-row:last-child { border-bottom: none; }
  .tx-wrap { display: flex; align-items: center; gap: 11px; }
  .tx-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.055); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .tx-name { font-size: 13px; font-weight: 600; }
  .tx-desc { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .amt-pos { font-size: 13px; font-weight: 700; color: #00ff87; }
  .dt { font-size: 12px; color: rgba(255,255,255,0.38); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.72); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
`
const ModalBox = styled.div`
  background: #0d0020; border: 1px solid #281a44;
  border-radius: 22px; padding: 30px; width: 420px;
  font-family: 'DM Sans', sans-serif;
  animation: modalIn 0.28s ease;

  .modal-hd { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; color:white; }
  .x-btn { background:rgba(255,255,255,0.07); border:none; color:rgba(255,255,255,0.4); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:13px; }
  .x-btn:hover { background:rgba(255,107,107,0.15); color:#ff6b6b; }
  .f-group { margin-bottom:14px; }
  .f-label { display:block; font-size:11.5px; font-weight:700; color:rgba(255,255,255,0.38); text-transform:uppercase; letter-spacing:0.4px; margin-bottom:7px; }
  .f-input, .f-sel { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; color:white; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .f-input:focus, .f-sel:focus { border-color:rgba(0,255,135,0.4); }
  .f-input::placeholder { color:rgba(255,255,255,0.3); }
  .f-sel option { background:#0d0020; }
  .f-row { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
  .f-submit { width:100%; border:none; border-radius:11px; padding:12px; font-size:14px; font-weight:700; cursor:pointer; margin-top:6px; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .f-submit:hover { opacity:0.85; }

  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`

export default Income