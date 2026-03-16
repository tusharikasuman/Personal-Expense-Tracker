import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'
import API from '../api/axios.js'

// ── Particle Card ──────────────────────────────────────────────────────────
const DEFAULT_GLOW = '216, 159, 246'
const createParticle = (x, y, color) => { const el = document.createElement('div'); el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`; return el }
const ParticleCard = ({ children, style, className, glowColor = DEFAULT_GLOW }) => {
  const ref = useRef(null), glowRef = useRef(null), particlesRef = useRef([]), timeoutsRef = useRef([]), isHovered = useRef(false), initialized = useRef(false), memoized = useRef([])
  const init = useCallback(() => { if (initialized.current || !ref.current) return; const { width, height } = ref.current.getBoundingClientRect(); memoized.current = Array.from({ length: 10 }, () => createParticle(Math.random() * width, Math.random() * height, glowColor)); initialized.current = true }, [glowColor])
  const clearParticles = useCallback(() => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; particlesRef.current.forEach(p => { gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) }) }); particlesRef.current = [] }, [])
  const spawnParticles = useCallback(() => { if (!ref.current || !isHovered.current) return; if (!initialized.current) init(); memoized.current.forEach((particle, i) => { const id = setTimeout(() => { if (!isHovered.current || !ref.current) return; const clone = particle.cloneNode(true); ref.current.appendChild(clone); particlesRef.current.push(clone); gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }); gsap.to(clone, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true }); gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true }) }, i * 80); timeoutsRef.current.push(id) }) }, [init])
  useEffect(() => {
    const el = ref.current, glow = glowRef.current; if (!el || !glow) return
    const onEnter = () => { isHovered.current = true; spawnParticles(); gsap.to(glow, { opacity: 1, duration: 0.3 }); gsap.to(el, { boxShadow: `0 4px 30px rgba(124,58,237,0.2),0 0 50px rgba(${glowColor},0.1)`, duration: 0.3 }) }
    const onLeave = () => { isHovered.current = false; clearParticles(); gsap.to(glow, { opacity: 0, duration: 0.3 }); gsap.to(el, { boxShadow: 'none', rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' }) }
    const onMove = e => { const rect = el.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top; glow.style.background = `radial-gradient(280px circle at ${(x/rect.width)*100}% ${(y/rect.height)*100}%,rgba(${glowColor},0.5) 0%,rgba(${glowColor},0.15) 40%,transparent 65%)`; gsap.to(el, { rotateX: ((y-rect.height/2)/rect.height)*-6, rotateY: ((x-rect.width/2)/rect.width)*6, duration: 0.15, ease: 'power2.out', transformPerspective: 1000 }) }
    const onClick = e => { const rect = el.getBoundingClientRect(), x = e.clientX-rect.left, y = e.clientY-rect.top, d = Math.max(Math.hypot(x,y),Math.hypot(x-rect.width,y),Math.hypot(x,y-rect.height),Math.hypot(x-rect.width,y-rect.height)); const ripple = document.createElement('div'); ripple.style.cssText = `position:absolute;width:${d*2}px;height:${d*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.15) 40%,transparent 70%);left:${x-d}px;top:${y-d}px;pointer-events:none;z-index:50;`; el.appendChild(ripple); gsap.fromTo(ripple,{scale:0,opacity:1},{scale:1,opacity:0,duration:0.8,ease:'power2.out',onComplete:()=>ripple.remove()}) }
    el.addEventListener('mouseenter',onEnter); el.addEventListener('mouseleave',onLeave); el.addEventListener('mousemove',onMove); el.addEventListener('click',onClick)
    return () => { isHovered.current = false; el.removeEventListener('mouseenter',onEnter); el.removeEventListener('mouseleave',onLeave); el.removeEventListener('mousemove',onMove); el.removeEventListener('click',onClick); clearParticles() }
  }, [spawnParticles, clearParticles, glowColor])
  return (
    <div ref={ref} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <div ref={glowRef} style={{ position:'absolute',inset:0,borderRadius:'inherit',padding:'1px',background:`radial-gradient(280px circle at 50% 50%,rgba(${glowColor},0.5) 0%,transparent 65%)`,WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',WebkitMaskComposite:'xor',maskComposite:'exclude',opacity:0,pointerEvents:'none',zIndex:10 }} />
      {children}
    </div>
  )
}

const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}><ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox></ModalOverlay>
)

// ── Budget Page ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Food & Groceries', icon: '🛒', color: '#00ff87' },
  { name: 'Transport',        icon: '🚗', color: '#00e5ff' },
  { name: 'Entertainment',    icon: '🎬', color: '#D89FF6' },
  { name: 'Health',           icon: '💊', color: '#ff6b6b' },
  { name: 'Housing',          icon: '🏠', color: '#ffaa00' },
  { name: 'Utilities',        icon: '⚡', color: '#ffdd57' },
  { name: 'Shopping',         icon: '🛍️', color: '#D89FF6' },
]

const Budget = () => {
  const [budgets, setBudgets]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ category_id: '', amount: '', period: 'monthly' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/budget')
        setBudgets(res.data?.budgets || res.data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleAdd = async () => {
    if (!form.category_id || !form.amount) { setError('Please fill in category and amount'); return }
    try {
      setSubmitting(true); setError('')
      const res = await API.post('/budget', { category_id: Number(form.category_id), amount: Number(form.amount), period: form.period })
      setBudgets(prev => [...prev, res.data?.budget || res.data])
      setForm({ category_id: '', amount: '', period: 'monthly' })
      setShowModal(false)
    } catch (err) { setError(err.response?.data?.message || 'Failed to add budget') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/budget/${id}`)
      setBudgets(prev => prev.filter(b => b.budget_id !== id && b.id !== id))
    } catch (err) { console.error(err) }
  }

  const fmt = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totalBudget  = budgets.reduce((s, b) => s + Number(b.amount || 0), 0)
  const totalSpent   = budgets.reduce((s, b) => s + Number(b.spent || 0), 0)
  const alerts       = budgets.filter(b => Number(b.spent || 0) / Number(b.amount || 1) >= 0.8)
  const onTrack      = budgets.filter(b => Number(b.spent || 0) / Number(b.amount || 1) < 0.7)

  const getCatMeta = (name) => CATEGORIES.find(c => c.name === name) || { icon: '💳', color: '#D89FF6' }

  const getStatus = (b) => {
    const pct = Number(b.spent || 0) / Number(b.amount || 1)
    if (pct >= 0.9) return { label: 'Near Limit', color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.25)' }
    if (pct >= 0.7) return { label: 'Watch Out',  color: '#ffaa00', bg: 'rgba(255,170,0,0.1)',   border: 'rgba(255,170,0,0.25)'   }
    return              { label: 'On Track',   color: '#00ff87', bg: 'rgba(0,255,135,0.1)',   border: 'rgba(0,255,135,0.25)'   }
  }

  if (loading) return <Wrapper><Navbar /><div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'80vh',color:'rgba(255,255,255,0.4)',fontSize:'14px' }}>Loading budgets...</div></Wrapper>

  return (
    <Wrapper>
      <Navbar />
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Budget</h1>
            <p className="page-sub">Set limits. Stay in control.</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ Add Budget</button>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          {[
            { label: 'Total Budget',  value: `$${fmt(totalBudget)}`,  sub: `${budgets.length} categories`,   color: '#D89FF6', icon: '📋' },
            { label: 'Total Spent',   value: `$${fmt(totalSpent)}`,   sub: 'this period',                    color: '#ff6b6b', icon: '💸' },
            { label: 'Remaining',     value: `$${fmt(totalBudget - totalSpent)}`, sub: 'available to spend', color: '#00ff87', icon: '✅' },
            { label: 'Alerts',        value: `${alerts.length}`,      sub: 'categories over 80%',            color: '#ffaa00', icon: '⚠️' },
          ].map((s, i) => (
            <ParticleCard key={i} className="stat-card">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color: s.color }}>{s.sub}</div>
            </ParticleCard>
          ))}
        </div>

        {/* Alert banner */}
        {alerts.length > 0 && (
          <div className="alert-banner">
            ⚠️ {alerts.length} budget{alerts.length > 1 ? 's are' : ' is'} over 80% — {alerts.map(b => b.category_name || b.name).join(', ')}
          </div>
        )}

        {/* Budget grid */}
        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No budgets yet</div>
            <div className="empty-sub">Add your first budget to start tracking spending</div>
            <button className="add-btn" onClick={() => setShowModal(true)}>＋ Add Budget</button>
          </div>
        ) : (
          <div className="budget-grid">
            {budgets.map((b, i) => {
              const pct    = Math.min(Math.round((Number(b.spent || 0) / Number(b.amount || 1)) * 100), 100)
              const meta   = getCatMeta(b.category_name || b.name)
              const status = getStatus(b)
              return (
                <ParticleCard key={b.budget_id || b.id || i} className="budget-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="bc-top">
                    <div className="bc-icon" style={{ background: `rgba(${meta.color === '#D89FF6' ? '216,159,246' : meta.color === '#00ff87' ? '0,255,135' : meta.color === '#ff6b6b' ? '255,107,107' : meta.color === '#ffaa00' ? '255,170,0' : meta.color === '#00e5ff' ? '0,229,255' : '255,221,87'},0.12)` }}>{meta.icon}</div>
                    <button className="del-btn" onClick={() => handleDelete(b.budget_id || b.id)}>✕</button>
                  </div>
                  <div className="bc-name">{b.category_name || b.name}</div>
                  <div className="bc-period">{b.period || 'monthly'}</div>
                  <div className="bc-amounts">
                    <span className="bc-spent">${fmt(b.spent || 0)}</span>
                    <span className="bc-limit"> / ${fmt(b.amount)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: status.color }} />
                  </div>
                  <div className="bc-footer">
                    <span className="bc-pct" style={{ color: status.color }}>{pct}% used</span>
                    <span className="status-pill" style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>{status.label}</span>
                  </div>
                </ParticleCard>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => { setShowModal(false); setError('') }}>
          <div className="modal-hd">Add Budget<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group"><label className="f-label">Category</label>
            <select className="f-sel" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {CATEGORIES.map((c, i) => <option key={i} value={i + 1}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Budget Limit ($)</label><input className="f-input" type="number" placeholder="e.g. 500" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="f-group"><label className="f-label">Period</label>
              <select className="f-sel" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <button className="f-submit" onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding...' : 'Add Budget'}</button>
        </Modal>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif;
  .page { max-width: 1080px; margin: 0 auto; padding: 100px 28px 60px; }
  .page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #D89FF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn { background: linear-gradient(135deg, #7c3aed, #D89FF6); border: none; border-radius: 12px; padding: 10px 18px; color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; white-space: nowrap; }
  .add-btn:hover { opacity: 0.85; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 20px; }
  .stat-card { background: #060010; border: 1px solid #392e4e; border-radius: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
  .stat-card:hover { transform: translateY(-2px); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }
  .alert-banner { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2); border-radius: 12px; padding: 12px 18px; color: #ff6b6b; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
  .budget-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .budget-card { background: #060010; border: 1px solid #1e1530; border-radius: 18px; padding: 20px; cursor: pointer; transition: transform 0.2s; animation: fadeUp 0.4s ease both; }
  .budget-card:hover { transform: translateY(-3px); }
  .bc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .bc-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .del-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: rgba(255,255,255,0.3); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; transition: all 0.2s; }
  .del-btn:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; border-color: rgba(255,107,107,0.3); }
  .bc-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .bc-period { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 14px; text-transform: capitalize; }
  .bc-amounts { margin-bottom: 10px; }
  .bc-spent { font-size: 18px; font-weight: 800; font-family: 'Syne', sans-serif; }
  .bc-limit { font-size: 13px; color: rgba(255,255,255,0.35); }
  .bar-track { background: rgba(255,255,255,0.06); border-radius: 6px; height: 5px; overflow: hidden; margin-bottom: 12px; }
  .bar-fill { height: 5px; border-radius: 6px; transition: width 0.6s ease; }
  .bc-footer { display: flex; justify-content: space-between; align-items: center; }
  .bc-pct { font-size: 11px; font-weight: 700; }
  .status-pill { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
  .empty-state { text-align: center; padding: 60px 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .empty-icon { font-size: 40px; opacity: 0.3; }
  .empty-text { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.5); }
  .empty-sub { font-size: 13px; color: rgba(255,255,255,0.25); margin-bottom: 10px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`
const ModalOverlay = styled.div`position:fixed;inset:0;z-index:999;background:rgba(0,0,0,0.72);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;`
const ModalBox = styled.div`
  background:#0d0020;border:1px solid #281a44;border-radius:22px;padding:30px;width:420px;font-family:'DM Sans',sans-serif;animation:modalIn 0.28s ease;
  .modal-hd{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;color:white;}
  .x-btn{background:rgba(255,255,255,0.07);border:none;color:rgba(255,255,255,0.4);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;}
  .x-btn:hover{background:rgba(255,107,107,0.15);color:#ff6b6b;}
  .err-box{background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);border-radius:9px;padding:9px 13px;color:#ff6b6b;font-size:12.5px;margin-bottom:14px;text-align:center;}
  .f-group{margin-bottom:14px;}
  .f-label{display:block;font-size:11.5px;font-weight:700;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:7px;}
  .f-input,.f-sel{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 13px;color:white;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.2s;}
  .f-input:focus,.f-sel:focus{border-color:rgba(216,159,246,0.45);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-sel option{background:#0d0020;}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .f-submit{width:100%;background:linear-gradient(135deg,#7c3aed,#D89FF6);border:none;border-radius:11px;padding:12px;color:white;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit:hover{opacity:0.85;}
  .f-submit:disabled{opacity:0.5;cursor:not-allowed;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

export default Budget