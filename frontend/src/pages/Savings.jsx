import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'
import API from '../api/axios.js'

const DEFAULT_GLOW = '216, 159, 246'
const createParticle = (x, y, color) => { const el = document.createElement('div'); el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`; return el }
const ParticleCard = ({ children, style, className, glowColor = DEFAULT_GLOW, onClick }) => {
  const ref = useRef(null), glowRef = useRef(null), particlesRef = useRef([]), timeoutsRef = useRef([]), isHovered = useRef(false), initialized = useRef(false), memoized = useRef([])
  const init = useCallback(() => { if (initialized.current || !ref.current) return; const { width, height } = ref.current.getBoundingClientRect(); memoized.current = Array.from({ length: 10 }, () => createParticle(Math.random() * width, Math.random() * height, glowColor)); initialized.current = true }, [glowColor])
  const clearParticles = useCallback(() => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; particlesRef.current.forEach(p => { gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) }) }); particlesRef.current = [] }, [])
  const spawnParticles = useCallback(() => { if (!ref.current || !isHovered.current) return; if (!initialized.current) init(); memoized.current.forEach((particle, i) => { const id = setTimeout(() => { if (!isHovered.current || !ref.current) return; const clone = particle.cloneNode(true); ref.current.appendChild(clone); particlesRef.current.push(clone); gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }); gsap.to(clone, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true }); gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true }) }, i * 80); timeoutsRef.current.push(id) }) }, [init])
  useEffect(() => {
    const el = ref.current, glow = glowRef.current; if (!el || !glow) return
    const onEnter = () => { isHovered.current = true; spawnParticles(); gsap.to(glow, { opacity: 1, duration: 0.3 }); gsap.to(el, { boxShadow: `0 4px 30px rgba(124,58,237,0.2),0 0 50px rgba(${glowColor},0.1)`, duration: 0.3 }) }
    const onLeave = () => { isHovered.current = false; clearParticles(); gsap.to(glow, { opacity: 0, duration: 0.3 }); gsap.to(el, { boxShadow: 'none', rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' }) }
    const onMove = e => { const rect = el.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top; glow.style.background = `radial-gradient(280px circle at ${(x/rect.width)*100}% ${(y/rect.height)*100}%,rgba(${glowColor},0.5) 0%,rgba(${glowColor},0.15) 40%,transparent 65%)`; gsap.to(el, { rotateX: ((y-rect.height/2)/rect.height)*-6, rotateY: ((x-rect.width/2)/rect.width)*6, duration: 0.15, ease: 'power2.out', transformPerspective: 1000 }) }
    const onClickFn = e => { const rect = el.getBoundingClientRect(), x = e.clientX-rect.left, y = e.clientY-rect.top, d = Math.max(Math.hypot(x,y),Math.hypot(x-rect.width,y),Math.hypot(x,y-rect.height),Math.hypot(x-rect.width,y-rect.height)); const ripple = document.createElement('div'); ripple.style.cssText = `position:absolute;width:${d*2}px;height:${d*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.15) 40%,transparent 70%);left:${x-d}px;top:${y-d}px;pointer-events:none;z-index:50;`; el.appendChild(ripple); gsap.fromTo(ripple,{scale:0,opacity:1},{scale:1,opacity:0,duration:0.8,ease:'power2.out',onComplete:()=>ripple.remove()}) }
    el.addEventListener('mouseenter',onEnter); el.addEventListener('mouseleave',onLeave); el.addEventListener('mousemove',onMove); el.addEventListener('click',onClickFn)
    return () => { isHovered.current = false; el.removeEventListener('mouseenter',onEnter); el.removeEventListener('mouseleave',onLeave); el.removeEventListener('mousemove',onMove); el.removeEventListener('click',onClickFn); clearParticles() }
  }, [spawnParticles, clearParticles, glowColor])
  return (
    <div ref={ref} className={className} style={{ ...style, position:'relative', overflow:'hidden' }} onClick={onClick}>
      <div ref={glowRef} style={{ position:'absolute',inset:0,borderRadius:'inherit',padding:'1px',background:`radial-gradient(280px circle at 50% 50%,rgba(${glowColor},0.5) 0%,transparent 65%)`,WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',WebkitMaskComposite:'xor',maskComposite:'exclude',opacity:0,pointerEvents:'none',zIndex:10 }} />
      {children}
    </div>
  )
}

const Modal = ({ onClose, children }) => (
  <ModalOverlay onClick={onClose}><ModalBox onClick={e => e.stopPropagation()}>{children}</ModalBox></ModalOverlay>
)

const GOAL_COLORS = ['#00ff87','#D89FF6','#ffaa00','#00e5ff','#ff6b6b','#ff6fd8']
const GOAL_EMOJIS = ['🏖️','💻','🚗','🏠','✈️','📱','🎓','💍','🎯','💰']

const Savings = () => {
  const [goals, setGoals]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [depositModal, setDepositModal] = useState(null)
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm]   = useState({ name: '', target_amount: '', deadline: '', emoji: '🎯' })
  const [deposit, setDeposit] = useState({ amount: '' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/savings-goals')
        setGoals(res.data?.goals || res.data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleAdd = async () => {
    if (!form.name || !form.target_amount) { setError('Please fill in name and target amount'); return }
    try {
      setSubmitting(true); setError('')
      const res = await API.post('/savings-goals', {
        goal_name: `${form.emoji} ${form.name}`,
        target_amount: Number(form.target_amount),
        deadline: form.deadline || null,
      })
      setGoals(prev => [...prev, res.data?.goal || res.data])
      setForm({ name:'', target_amount:'', deadline:'', emoji:'🎯' }); setShowModal(false)
    } catch (err) { setError(err.response?.data?.message || 'Failed to create goal') }
    finally { setSubmitting(false) }
  }

  const handleDeposit = async (goalId) => {
    if (!deposit.amount) { setError('Please enter an amount'); return }
    try {
      setSubmitting(true); setError('')
      const res = await API.put(`/savings-goals/${goalId}`, { current_amount_add: Number(deposit.amount) })
      setGoals(prev => prev.map(g => (g.goal_id||g.id) === goalId ? { ...g, ...res.data?.goal || res.data } : g))
      setDeposit({ amount:'' }); setDepositModal(null)
    } catch (err) { setError(err.response?.data?.message || 'Failed to update goal') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/savings-goals/${id}`)
      setGoals(prev => prev.filter(g => (g.goal_id||g.id) !== id))
    } catch (err) { console.error(err) }
  }

  const fmt = n => Number(n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })

  const totalSaved  = goals.reduce((s, g) => s + Number(g.saved_amount||0), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount||0), 0)

  const getColor = (i) => GOAL_COLORS[i % GOAL_COLORS.length]

  if (loading) return <Wrapper><Navbar /><div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'80vh',color:'rgba(255,255,255,0.4)',fontSize:'14px' }}>Loading goals...</div></Wrapper>

  return (
    <Wrapper>
      <Navbar />
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">Savings Goals</h1><p className="page-sub">Dream big, save smart</p></div>
          <button className="add-btn" onClick={() => { setError(''); setShowModal(true) }}>＋ New Goal</button>
        </div>

        <div className="stat-grid">
          {[
            { label:'Total Saved',      value:`$${fmt(totalSaved)}`,  sub:'across all goals',    color:'#00e5ff', icon:'💰' },
            { label:'Active Goals',     value:`${goals.length}`,      sub:'in progress',          color:'#D89FF6', icon:'🎯' },
            { label:'Total Target',     value:`$${fmt(totalTarget)}`, sub:'combined goal amount', color:'#ffaa00', icon:'📊' },
            { label:'Avg Progress',     value:totalTarget ? `${Math.round(totalSaved/totalTarget*100)}%` : '0%', sub:'toward all goals', color:'#00ff87', icon:'📈' },
          ].map((s,i) => (
            <ParticleCard key={i} className="stat-card">
              <div className="s-icon">{s.icon}</div>
              <div className="s-label">{s.label}</div>
              <div className="s-val" style={{ color:s.color }}>{s.value}</div>
              <div className="s-sub" style={{ color:s.color }}>{s.sub}</div>
            </ParticleCard>
          ))}
        </div>

        <div className="bento-grid">
          {goals.map((g, i) => {
            const saved = Number(g.current_amount||0)
            const total = Number(g.target_amount||1)
            const pct   = Math.min(Math.round(saved/total*100),100)
            const color = getColor(i)
            return (
              <ParticleCard key={g.goal_id||g.id||i} className="goal-card" style={{ animationDelay:`${i*0.07}s` }}>
                <div className="goal-top-bar" style={{ background:color }} />
                <div className="goal-header">
                  <div className="goal-name">{g.goal_name}</div>
                  <button className="del-btn" onClick={() => handleDelete(g.goal_id||g.id)}>🗑</button>
                </div>
                {g.deadline && <div className="goal-target">🗓 {new Date(g.deadline).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>}
                <div className="goal-amounts">
                  <span className="goal-saved" style={{ color }}>${fmt(saved)}</span>
                  <span className="goal-of">of ${fmt(total)}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width:`${pct}%`, background:color }} /></div>
                <div className="goal-footer">
                  <span className="goal-pct" style={{ color }}>{pct}% complete</span>
                  <button className="deposit-btn" onClick={() => { setDepositModal(g.goal_id||g.id); setError('') }}>＋ Add</button>
                </div>
              </ParticleCard>
            )
          })}

          <ParticleCard className="add-goal-card" onClick={() => { setError(''); setShowModal(true) }}>
            <div className="add-icon">＋</div>
            <div className="add-text">Add a new goal</div>
            <button className="add-inner-btn">Create Goal</button>
          </ParticleCard>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setError('') }}>
          <div className="modal-hd">🎯 New Goal<button className="x-btn" onClick={() => setShowModal(false)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group">
            <label className="f-label">Pick an Emoji</label>
            <div className="emoji-grid">{GOAL_EMOJIS.map(e => <button key={e} className={`emoji-btn ${form.emoji===e?'active':''}`} onClick={() => setForm({...form,emoji:e})}>{e}</button>)}</div>
          </div>
          <div className="f-group"><label className="f-label">Goal Name</label><input className="f-input" placeholder="e.g. Vacation" value={form.name} onChange={e => setForm({...form,name:e.target.value})} /></div>
          <div className="f-row">
            <div className="f-group"><label className="f-label">Target ($)</label><input className="f-input" type="number" placeholder="2000" value={form.target_amount} onChange={e => setForm({...form,target_amount:e.target.value})} /></div>
            <div className="f-group"><label className="f-label">Deadline</label><input className="f-input" type="month" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})} /></div>
          </div>
          <button className="f-submit" style={{ background:'linear-gradient(135deg,#0099b3,#00e5ff)',color:'#000' }} onClick={handleAdd} disabled={submitting}>{submitting?'Creating...':'Create Goal'}</button>
        </Modal>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <Modal onClose={() => { setDepositModal(null); setError('') }}>
          <div className="modal-hd">＋ Add to Goal<button className="x-btn" onClick={() => setDepositModal(null)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group"><label className="f-label">Amount to Add ($)</label><input className="f-input" type="number" placeholder="e.g. 100" value={deposit.amount} onChange={e => setDeposit({amount:e.target.value})} /></div>
          <button className="f-submit" onClick={() => handleDeposit(depositModal)} disabled={submitting}>{submitting?'Saving...':'Add to Goal'}</button>
        </Modal>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height:100vh; color:white; font-family:'DM Sans',sans-serif;
  .page { max-width:1080px; margin:0 auto; padding:100px 28px 60px; }
  .page-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; }
  .page-title { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background:linear-gradient(135deg,#fff,#00e5ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .page-sub { font-size:12.5px; color:rgba(255,255,255,0.38); margin-top:5px; }
  .add-btn { display:flex; align-items:center; gap:7px; background:linear-gradient(135deg,#0099b3,#00e5ff); border:none; border-radius:12px; padding:10px 18px; color:#000; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
  .add-btn:hover { opacity:0.85; }
  .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:24px; }
  .stat-card { background:#060010; border:1px solid #392e4e; border-radius:16px; padding:20px; cursor:pointer; transition:transform 0.2s; }
  .stat-card:hover { transform:translateY(-2px); }
  .s-icon { font-size:19px; opacity:0.65; margin-bottom:10px; }
  .s-label { font-size:10.5px; font-weight:700; color:rgba(255,255,255,0.38); text-transform:uppercase; letter-spacing:0.6px; }
  .s-val { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; margin:8px 0 4px; }
  .s-sub { font-size:11px; }
  .bento-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .goal-card { background:#060010; border:1px solid #392e4e; border-radius:20px; padding:22px; display:flex; flex-direction:column; gap:10px; cursor:pointer; position:relative; animation:fadeUp 0.4s ease both; min-height:240px; transition:transform 0.2s; }
  .goal-card:hover { transform:translateY(-3px); }
  .goal-top-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:20px 20px 0 0; }
  .goal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-top:4px; }
  .goal-name { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; }
  .goal-target { font-size:11.5px; color:rgba(255,255,255,0.38); }
  .goal-amounts { display:flex; justify-content:space-between; align-items:flex-end; margin-top:auto; }
  .goal-saved { font-family:'Syne',sans-serif; font-size:19px; font-weight:800; }
  .goal-of { font-size:12px; color:rgba(255,255,255,0.38); }
  .bar-track { background:rgba(255,255,255,0.06); border-radius:6px; height:6px; overflow:hidden; }
  .bar-fill { height:6px; border-radius:6px; transition:width 1s cubic-bezier(0.4,0,0.2,1); }
  .goal-footer { display:flex; justify-content:space-between; align-items:center; }
  .goal-pct { font-size:12px; font-weight:700; }
  .deposit-btn { background:rgba(216,159,246,0.1); border:1px solid rgba(216,159,246,0.25); border-radius:20px; padding:4px 12px; color:#D89FF6; font-size:11px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .deposit-btn:hover { background:rgba(216,159,246,0.2); }
  .del-btn { background:rgba(255,107,107,0.08); border:1px solid rgba(255,107,107,0.15); border-radius:7px; padding:4px 7px; cursor:pointer; font-size:12px; transition:all 0.2s; }
  .del-btn:hover { background:rgba(255,107,107,0.2); }
  .add-goal-card { background:rgba(255,255,255,0.018); border:1.5px dashed rgba(255,255,255,0.1); border-radius:20px; padding:22px; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:240px; cursor:pointer; transition:all 0.2s; text-align:center; gap:12px; }
  .add-goal-card:hover { background:rgba(216,159,246,0.05); border-color:rgba(216,159,246,0.3); }
  .add-icon { font-size:30px; opacity:0.4; }
  .add-text { font-size:13px; color:rgba(255,255,255,0.4); }
  .add-inner-btn { background:rgba(216,159,246,0.1); border:1px solid rgba(216,159,246,0.25); border-radius:20px; padding:7px 18px; color:#D89FF6; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
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
  .f-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 13px;color:white;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.2s;}
  .f-input:focus{border-color:rgba(0,229,255,0.4);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .emoji-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}
  .emoji-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;font-size:18px;cursor:pointer;transition:all 0.2s;}
  .emoji-btn.active{background:rgba(216,159,246,0.15);border-color:rgba(216,159,246,0.4);}
  .emoji-btn:hover{background:rgba(255,255,255,0.08);}
  .f-submit{width:100%;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit:hover{opacity:0.85;}
  .f-submit:disabled{opacity:0.5;cursor:not-allowed;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`
export default Savings