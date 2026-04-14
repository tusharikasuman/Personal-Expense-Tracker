import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'
import API from '../api/axios.js'

// ── Particle Card ──────────────────────────────────────────────────────────
const DEFAULT_GLOW = '216, 159, 246'
const createParticle = (x, y, color) => {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`
  return el
}
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

// ── Modal ──────────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}>
    <ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox>
  </ModalOverlay>
)

// ── Expenses Page ──────────────────────────────────────────────────────────
const Expenses = () => {
  const [expenses, setExpenses]         = useState([])
  const [categories, setCategories]     = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch]             = useState('')
  const [form, setForm] = useState({ description: '', amount: '', date: '', category_id: '', payment_method: 'Cash' })
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  const filters = ['All', ...categories.map(c => c.category_name)]

  // ── Fetch expenses + categories + summary ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [expRes, catRes, sumRes] = await Promise.all([
          API.get('/expenses'),
          API.get('/expenses/categories').catch(() => ({ data: [] })),
          API.get('/expenses/summary').catch(() => ({ data: null })),
        ])
        setExpenses(expRes.data?.expenses || expRes.data || [])
        setCategories(catRes.data?.categories || catRes.data || [])
        setStats(sumRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Add expense ──
  const handleAdd = async () => {
  if (!form.description || !form.amount || !form.date) {
    setError('Please fill in description, amount and date')
    return
  }
  try {
    setSubmitting(true)
    setError('')
    const res = await API.post('/expenses', {
      note:           form.description,   // ← your DB has no "description" col, note goes to expense_notes
      amount:         Number(form.amount),
      expense_date:   form.date,          // ← was "date", controller needs "expense_date"
      category_id:    form.category_id ? Number(form.category_id) : null,
      payment_id:     null,               // ← controller expects payment_id (int), handle below
    })
    const newExp = res.data?.expense || res.data
    setExpenses(prev => [newExp, ...prev])
    setForm({ description: '', amount: '', date: '', category_id: '', payment_method: 'Cash' })
    setShowModal(false)
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to add expense')
  } finally {
    setSubmitting(false)
  }
}

  // ── Delete expense ──
  const handleDelete = async (id) => {
    try {
      await API.delete(`/expenses/${id}`)
      setExpenses(prev => prev.filter(e => e.expense_id !== id && e.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ── Filter + search ──
  const filtered = expenses.filter(e => {
    const matchFilter = activeFilter === 'All' || e.category_name === activeFilter
    const matchSearch = (e.description || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const getCatStyle = (name) => {
    const styles = {
      'Food & Groceries': { background: 'rgba(0,255,135,0.08)',  color: '#00ff87', border: '1px solid rgba(0,255,135,0.15)'  },
      'Transport':        { background: 'rgba(0,229,255,0.08)',  color: '#00e5ff', border: '1px solid rgba(0,229,255,0.15)'  },
      'Entertainment':    { background: 'rgba(216,159,246,0.1)', color: '#D89FF6', border: '1px solid rgba(216,159,246,0.2)' },
      'Health':           { background: 'rgba(216,159,246,0.1)', color: '#D89FF6', border: '1px solid rgba(216,159,246,0.2)' },
      'Housing':          { background: 'rgba(255,170,0,0.1)',   color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)'   },
      'Utilities':        { background: 'rgba(255,170,0,0.1)',   color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)'   },
      'Shopping':         { background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' },
    }
    return styles[name] || { background: 'rgba(216,159,246,0.1)', color: '#D89FF6', border: '1px solid rgba(216,159,246,0.2)' }
  }

  const getCatIcon = (name) => {
    const icons = { 'Food & Groceries': '🛒', 'Transport': '🚗', 'Entertainment': '🎬', 'Health': '💊', 'Housing': '🏠', 'Utilities': '⚡', 'Shopping': '🛍️' }
    return icons[name] || '💳'
  }

 const thisMonthTotal = expenses.filter(e => {
  const d = new Date(e.expense_date || e.created_at)  // ← was e.date
  return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()
}).reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const biggest = expenses.reduce((max, e) => Number(e.amount) > Number(max.amount || 0) ? e : max, {})

  const statCards = [
    { label: 'This Month',   value: `$${fmt(thisMonthTotal)}`, sub: '↑ current month',       color: '#ff6b6b', icon: '📉' },
    { label: 'Total Entries',value: `${expenses.length}`,      sub: 'all time',               color: 'white',   icon: '📅' },
    { label: 'Biggest',      value: biggest.amount ? `$${fmt(biggest.amount)}` : '—', sub: biggest.description || '—', color: '#ffaa00', icon: '🏆' },
    { label: 'Daily Avg',    value: expenses.length ? `$${fmt(thisMonthTotal / new Date().getDate())}` : '—', sub: 'this month', color: '#D89FF6', icon: '📊' },
  ]

  if (loading) return (
    <Wrapper>
      <Navbar />
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'80vh',color:'rgba(255,255,255,0.4)',fontSize:'14px' }}>Loading expenses...</div>
    </Wrapper>
  )

  return (
    <Wrapper>
      <Navbar />
      <div className="page">

        <div className="page-head">
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-sub">Track every rupee you spend</p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>＋ Add Expense</button>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          {statCards.map((s, i) => (
            <ParticleCard key={i} className="stat-card">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color: s.color === 'white' ? 'rgba(255,255,255,0.4)' : s.color }}>{s.sub}</div>
            </ParticleCard>
          ))}
        </div>

        {/* Filters */}
        <div className="filters">
          {['All', 'Food & Groceries', 'Transport', 'Entertainment', 'Health', 'Housing', 'Shopping'].map(f => (
            <button key={f} className={`f-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          <div className="search-wrap">
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>🔍</span>
            <input placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <ParticleCard className="tbl">
          <div className="tbl-head">
            <div className="tbl-th">Description</div>
            <div className="tbl-th">Category</div>
            <div className="tbl-th">Date</div>
            <div className="tbl-th">Amount</div>
            <div className="tbl-th">Action</div>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
              {expenses.length === 0 ? 'No expenses yet — add your first one!' : 'No expenses match your search'}
            </div>
          ) : (
            filtered.map((tx, i) => (
              <div className="tbl-row" key={tx.expense_id || tx.id || i} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="tx-wrap">
                  <div className="tx-ico">{getCatIcon(tx.category_name)}</div>
                  <div>
                    <div className="tx-name">{tx.description}</div>
                    <div className="tx-desc">{tx.payment_method || 'Cash'}</div>
                  </div>
                </div>
                <div>
                  <span className="pill" style={getCatStyle(tx.category_name)}>{tx.category_name || 'Uncategorized'}</span>
                </div>
                <div className="dt">{tx.expense_date ? new Date(tx.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                <div className="amt-neg">−${fmt(tx.amount)}</div>
                <div>
                  <button className="del-btn" onClick={() => handleDelete(tx.expense_id || tx.id)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </ParticleCard>

      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setError('') }}>
          <div className="modal-hd">Add Expense<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group"><label className="f-label">Description</label><input className="f-input" placeholder="e.g. Netflix subscription" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Amount ($)</label><input className="f-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="f-group"><label className="f-label">Date</label><input className="f-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="f-group"><label className="f-label">Category</label>
            <select className="f-sel" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.length > 0
                ? categories.map(c => <option key={c.category_id || c.id} value={c.category_id || c.id}>{c.category_name}</option>)
                : ['Food & Groceries','Transport','Entertainment','Health','Housing','Utilities','Shopping'].map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>
          <div className="f-group"><label className="f-label">Payment Method</label>
            <select className="f-sel" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option>Cash</option><option>Credit Card</option><option>Debit Card</option><option>UPI</option>
            </select>
          </div>
          <button className="f-submit" onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
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
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #fff, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .page-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); margin-top: 5px; }
  .add-btn { display: flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #7c3aed, #D89FF6); border: none; border-radius: 12px; padding: 10px 18px; color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; white-space: nowrap; }
  .add-btn:hover { opacity: 0.85; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 24px; }
  .stat-card { background: #060010; border: 1px solid #392e4e; border-radius: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
  .stat-card:hover { transform: translateY(-2px); }
  .s-icon { font-size: 19px; opacity: 0.65; margin-bottom: 10px; }
  .s-label { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.6px; }
  .s-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
  .s-sub { font-size: 11px; }
  .filters { display: flex; gap: 8px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  .f-btn { padding: 6px 14px; border-radius: 50px; border: 1px solid #1e1530; background: transparent; color: rgba(255,255,255,0.38); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .f-btn.active, .f-btn:hover { background: rgba(216,159,246,0.1); color: #D89FF6; border-color: rgba(216,159,246,0.25); }
  .search-wrap { margin-left: auto; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid #1e1530; border-radius: 10px; padding: 7px 13px; }
  .search-wrap input { background: none; border: none; outline: none; color: white; font-size: 12.5px; font-family: 'DM Sans', sans-serif; width: 170px; }
  .search-wrap input::placeholder { color: rgba(255,255,255,0.3); }
  .tbl { background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 18px; overflow: hidden; }
  .tbl-head { display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr 0.6fr; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .tbl-th { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.5px; }
  .tbl-row { display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr 0.6fr; padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.18s; animation: fadeUp 0.4s ease both; }
  .tbl-row:hover { background: rgba(255,255,255,0.025); }
  .tbl-row:last-child { border-bottom: none; }
  .tx-wrap { display: flex; align-items: center; gap: 11px; }
  .tx-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.055); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .tx-name { font-size: 13px; font-weight: 600; }
  .tx-desc { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .amt-neg { font-size: 13px; font-weight: 700; color: #ff6b6b; }
  .dt { font-size: 12px; color: rgba(255,255,255,0.38); }
  .del-btn { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.15); border-radius: 7px; padding: 5px 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
  .del-btn:hover { background: rgba(255,107,107,0.2); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`
const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,0.72); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center;
`
const ModalBox = styled.div`
  background: #0d0020; border: 1px solid #281a44; border-radius: 22px; padding: 30px; width: 420px; font-family: 'DM Sans', sans-serif; animation: modalIn 0.28s ease;
  .modal-hd { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; color: white; }
  .x-btn { background: rgba(255,255,255,0.07); border: none; color: rgba(255,255,255,0.4); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 13px; }
  .x-btn:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
  .err-box { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.25); border-radius: 9px; padding: 9px 13px; color: #ff6b6b; font-size: 12.5px; margin-bottom: 14px; text-align: center; }
  .f-group { margin-bottom: 14px; }
  .f-label { display: block; font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.38); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 7px; }
  .f-input, .f-sel { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 11px 13px; color: white; font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s; }
  .f-input:focus, .f-sel:focus { border-color: rgba(216,159,246,0.45); }
  .f-input::placeholder { color: rgba(255,255,255,0.3); }
  .f-sel option { background: #0d0020; }
  .f-row { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
  .f-submit { width: 100%; background: linear-gradient(135deg, #7c3aed, #D89FF6); border: none; border-radius: 11px; padding: 12px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 6px; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .f-submit:hover { opacity: 0.85; }
  .f-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`

export default Expenses