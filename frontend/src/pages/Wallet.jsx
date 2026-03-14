import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'

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

// ── Wallet Page ────────────────────────────────────────────────────────────
const Wallet = () => {
  const [modalType, setModalType] = useState(null) // 'add' | 'transfer' | null

  const transactions = [
    { icon: '🎬', name: 'Netflix',          desc: 'Subscription',    date: 'Mar 12', amount: -15,    },
    { icon: '💼', name: 'Salary Credit',    desc: 'Tech Corp Ltd.',  date: 'Mar 10', amount: 3200,   },
    { icon: '🛒', name: 'BigBasket',        desc: 'Groceries',       date: 'Mar 9',  amount: -84.50, },
    { icon: '💻', name: 'Freelance Pay',    desc: 'Client project',  date: 'Mar 8',  amount: 500,    },
    { icon: '⚡', name: 'Electricity Bill', desc: 'TNEB March',      date: 'Mar 7',  amount: -85,    },
    { icon: '🏋️', name: 'Gym',             desc: 'Monthly fee',     date: 'Mar 6',  amount: -40,    },
  ]

  const accounts = [
    { icon: '🏦', name: 'SBI Savings',  last4: '4821', balance: 9800,  color: 'rgba(0,229,255,0.1)',   isDefault: true  },
    { icon: '💳', name: 'HDFC Credit',  last4: '3390', balance: 2200,  color: 'rgba(255,170,0,0.1)',   isDefault: false },
    { icon: '📱', name: 'UPI / GPay',   last4: null,   balance: 480,   color: 'rgba(0,255,135,0.1)',   isDefault: false },
  ]

  return (
    <Wrapper>
      <Navbar />
      <div className="page">

        {/* Header */}
        <div className="page-head">
          <div>
            <h1 className="page-title">Wallet</h1>
            <p className="page-sub">All your accounts, cards and spending</p>
          </div>
          <div className="header-btns">
            <button className="btn-outline" onClick={() => setModalType('transfer')}>⇄ Transfer</button>
            <button className="add-btn"     onClick={() => setModalType('add')}>＋ Add Funds</button>
          </div>
        </div>

        {/* Hero balance card */}
        <ParticleCard className="wallet-hero">
          <div className="hero-inner">
            <div>
              <div className="w-label">Total Balance</div>
              <div className="w-balance">$12,480.00</div>
              <div className="w-sub">Across all accounts · Updated just now</div>
              <div className="w-stats">
                <div><div className="w-stat-val" style={{ color: '#00ff87' }}>$5,200</div><div className="w-stat-lbl">Income this month</div></div>
                <div><div className="w-stat-val" style={{ color: '#ff6b6b' }}>$2,340</div><div className="w-stat-lbl">Spent this month</div></div>
                <div><div className="w-stat-val" style={{ color: '#D89FF6' }}>$2,860</div><div className="w-stat-lbl">Saved this month</div></div>
              </div>
            </div>
            <div className="hero-card-icon">💳</div>
          </div>
        </ParticleCard>

        {/* Two col */}
        <div className="two-col">

          {/* Recent Activity */}
          <ParticleCard className="card">
            <div className="card-title">
              <span>🧾 Recent Activity</span>
              <span className="card-link">View all →</span>
            </div>
            <div className="tx-list">
              {transactions.map((tx, i) => (
                <div className="tx-row" key={i}>
                  <div className="tx-left">
                    <div className="tx-ico">{tx.icon}</div>
                    <div>
                      <div className="tx-name">{tx.name}</div>
                      <div className="tx-desc">{tx.desc} · {tx.date}</div>
                    </div>
                  </div>
                  <div className={tx.amount < 0 ? 'amt-neg' : 'amt-pos'}>
                    {tx.amount < 0 ? '−' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </ParticleCard>

          {/* Payment Methods */}
          <ParticleCard className="card">
            <div className="card-title"><span>💳 Payment Methods</span></div>
            <div className="accounts-list">
              {accounts.map((acc, i) => (
                <div className="acc-item" key={i}>
                  <div className="acc-left">
                    <div className="acc-ico" style={{ background: acc.color }}>{acc.icon}</div>
                    <div>
                      <div className="acc-name">
                        {acc.name}
                        {acc.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="acc-last">
                        {acc.last4 ? `•••• ${acc.last4}` : 'Linked'}
                      </div>
                    </div>
                  </div>
                  <div className="acc-bal">${acc.balance.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="quick-actions">
              <button className="q-btn" onClick={() => setModalType('add')}>＋ Add Funds</button>
              <button className="q-btn" onClick={() => setModalType('transfer')}>⇄ Transfer</button>
            </div>
          </ParticleCard>

        </div>

      </div>

      {/* Modals */}
      {modalType === 'add' && (
        <Modal onClose={() => setModalType(null)}>
          <div className="modal-hd">
            ＋ Add Funds
            <button className="x-btn" onClick={() => setModalType(null)}>✕</button>
          </div>
          <div className="f-group">
            <label className="f-label">Amount ($)</label>
            <input className="f-input" type="number" placeholder="0.00" />
          </div>
          <div className="f-group">
            <label className="f-label">Account</label>
            <select className="f-sel">
              <option>SBI Savings •••• 4821</option>
              <option>HDFC Credit •••• 3390</option>
              <option>UPI / GPay</option>
            </select>
          </div>
          <div className="f-group">
            <label className="f-label">Note (optional)</label>
            <input className="f-input" placeholder="What's this for?" />
          </div>
          <button className="f-submit">Confirm</button>
        </Modal>
      )}

      {modalType === 'transfer' && (
        <Modal onClose={() => setModalType(null)}>
          <div className="modal-hd">
            ⇄ Transfer Funds
            <button className="x-btn" onClick={() => setModalType(null)}>✕</button>
          </div>
          <div className="f-group">
            <label className="f-label">From</label>
            <select className="f-sel">
              <option>SBI Savings •••• 4821</option>
              <option>HDFC Credit •••• 3390</option>
              <option>UPI / GPay</option>
            </select>
          </div>
          <div className="f-group">
            <label className="f-label">To</label>
            <select className="f-sel">
              <option>HDFC Credit •••• 3390</option>
              <option>SBI Savings •••• 4821</option>
              <option>UPI / GPay</option>
            </select>
          </div>
          <div className="f-group">
            <label className="f-label">Amount ($)</label>
            <input className="f-input" type="number" placeholder="0.00" />
          </div>
          <button className="f-submit">Transfer</button>
        </Modal>
      )}

    </Wrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;

  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }

  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    background: linear-gradient(135deg, #fff, #D89FF6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .header-btns { display: flex; gap: 10px; }
  .add-btn {
    display: flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #7c3aed, #D89FF6);
    border: none; border-radius: 12px; padding: 10px 18px;
    color: white; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
  }
  .add-btn:hover { opacity: 0.85; }
  .btn-outline {
    display: flex; align-items: center; gap: 7px;
    background: rgba(216,159,246,0.08); border: 1px solid rgba(216,159,246,0.25);
    border-radius: 12px; padding: 9px 18px;
    color: #D89FF6; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .btn-outline:hover { background: rgba(216,159,246,0.15); }

  /* hero */
  .wallet-hero {
    background: linear-gradient(135deg, #160030, #3a1260, #160030);
    border: 1px solid rgba(216,159,246,0.18); border-radius: 22px;
    padding: 32px; margin-bottom: 24px;
  }
  .hero-inner { display: flex; justify-content: space-between; align-items: flex-start; }
  .hero-card-icon { font-size: 72px; opacity: 0.12; align-self: flex-end; }
  .w-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .w-balance { font-family: 'Syne', sans-serif; font-size: 44px; font-weight: 800; margin-bottom: 5px; }
  .w-sub { font-size: 12px; color: rgba(255,255,255,0.42); margin-bottom: 28px; }
  .w-stats { display: flex; gap: 36px; }
  .w-stat-val { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; }
  .w-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px; }

  /* two col */
  .two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
  .card { background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 20px; padding: 22px; }
  .card-title {
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55);
    text-transform: uppercase; letter-spacing: 0.6px;
    margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;
  }
  .card-link { font-size: 12px; color: #D89FF6; cursor: pointer; opacity: 0.8; }
  .card-link:hover { opacity: 1; }

  /* transactions */
  .tx-list { display: flex; flex-direction: column; gap: 2px; }
  .tx-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 10px; border-radius: 10px; transition: background 0.18s; cursor: pointer;
  }
  .tx-row:hover { background: rgba(255,255,255,0.03); }
  .tx-left { display: flex; align-items: center; gap: 11px; }
  .tx-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.055); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .tx-name { font-size: 13px; font-weight: 600; }
  .tx-desc { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .amt-neg { font-size: 13px; font-weight: 700; color: #ff6b6b; }
  .amt-pos { font-size: 13px; font-weight: 700; color: #00ff87; }

  /* accounts */
  .accounts-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
  .acc-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 14px; background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.055); border-radius: 13px;
    transition: border-color 0.2s;
  }
  .acc-item:hover { border-color: rgba(216,159,246,0.2); }
  .acc-left { display: flex; align-items: center; gap: 11px; }
  .acc-ico { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 19px; }
  .acc-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .acc-last { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .acc-bal { font-size: 13px; font-weight: 700; color: #D89FF6; }
  .default-badge {
    background: rgba(216,159,246,0.1); color: #D89FF6;
    border: 1px solid rgba(216,159,246,0.2); padding: 2px 8px;
    border-radius: 20px; font-size: 10px; font-weight: 600;
  }

  /* quick actions */
  .quick-actions { display: flex; gap: 8px; }
  .q-btn {
    flex: 1; padding: 9px; border-radius: 10px;
    background: rgba(216,159,246,0.08); border: 1px solid rgba(216,159,246,0.2);
    color: #D89FF6; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .q-btn:hover { background: rgba(216,159,246,0.16); }
`

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.72); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
`
const ModalBox = styled.div`
  background: #0d0020; border: 1px solid #281a44;
  border-radius: 22px; padding: 30px; width: 420px;
  font-family: 'DM Sans', sans-serif; animation: modalIn 0.28s ease;

  .modal-hd { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; color:white; }
  .x-btn { background:rgba(255,255,255,0.07); border:none; color:rgba(255,255,255,0.4); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:13px; }
  .x-btn:hover { background:rgba(255,107,107,0.15); color:#ff6b6b; }
  .f-group { margin-bottom:14px; }
  .f-label { display:block; font-size:11.5px; font-weight:700; color:rgba(255,255,255,0.38); text-transform:uppercase; letter-spacing:0.4px; margin-bottom:7px; }
  .f-input, .f-sel { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; color:white; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .f-input:focus, .f-sel:focus { border-color:rgba(216,159,246,0.45); }
  .f-input::placeholder { color:rgba(255,255,255,0.3); }
  .f-sel option { background:#0d0020; }
  .f-row { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
  .f-submit { width:100%; background:linear-gradient(135deg,#7c3aed,#D89FF6); border:none; border-radius:11px; padding:12px; color:white; font-size:14px; font-weight:700; cursor:pointer; margin-top:6px; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .f-submit:hover { opacity:0.85; }

  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`

export default Wallet