import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import styled from 'styled-components'
import { gsap } from 'gsap'
import API from '../api/axios.js'

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

const Wallet = () => {
  const [wallet, setWallet]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showAdd, setShowAdd]         = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [error, setError]             = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [addForm, setAddForm]         = useState({ amount: '', description: '' })
  const [transferForm, setTransferForm] = useState({ amount: '', description: '' })

  const fetchWallet = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        API.get('/wallet'),
        API.get('/wallet/transactions'),
      ])
      setWallet(walletRes.data?.wallet || walletRes.data)
      setTransactions(txRes.data?.transactions || txRes.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWallet() }, [])

  const handleAddFunds = async () => {
    if (!addForm.amount || Number(addForm.amount) <= 0) { setError('Enter a valid amount'); return }
    try {
      setSubmitting(true); setError('')
      await API.post('/wallet/add', { amount: Number(addForm.amount), description: addForm.description || 'Funds added' })
      await fetchWallet()
      setAddForm({ amount: '', description: '' })
      setShowAdd(false)
    } catch (err) { setError(err.response?.data?.message || 'Failed to add funds') }
    finally { setSubmitting(false) }
  }

  const handleTransfer = async () => {
    if (!transferForm.amount || Number(transferForm.amount) <= 0) { setError('Enter a valid amount'); return }
    try {
      setSubmitting(true); setError('')
      await API.post('/wallet/transfer', { amount: Number(transferForm.amount), description: transferForm.description || 'Transfer' })
      await fetchWallet()
      setTransferForm({ amount: '', description: '' })
      setShowTransfer(false)
    } catch (err) { setError(err.response?.data?.message || 'Transfer failed') }
    finally { setSubmitting(false) }
  }

  const fmt = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totalIn  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOut = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0)

  if (loading) return <Wrapper><Navbar /><div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'80vh',color:'rgba(255,255,255,0.4)',fontSize:'14px' }}>Loading wallet...</div></Wrapper>

  return (
    <Wrapper>
      <Navbar />
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Wallet</h1>
            <p className="page-sub">Manage your balance and transactions</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-btn green" onClick={() => setShowAdd(true)}>＋ Add Funds</button>
            <button className="add-btn purple" onClick={() => setShowTransfer(true)}>⇄ Transfer</button>
          </div>
        </div>

        {/* Hero balance card */}
        <ParticleCard className="hero-card">
          <div className="hero-left">
            <div className="hero-label">Total Balance</div>
            <div className="hero-val">${fmt(wallet?.balance)}</div>
            <div className="hero-currency">{wallet?.currency || 'USD'} Account</div>
          </div>
          <div className="hero-right">
            <div className="mini-stat">
              <div className="mini-label">💰 Total In</div>
              <div className="mini-val green">${fmt(totalIn)}</div>
            </div>
            <div className="mini-divider" />
            <div className="mini-stat">
              <div className="mini-label">💸 Total Out</div>
              <div className="mini-val red">${fmt(totalOut)}</div>
            </div>
            <div className="mini-divider" />
            <div className="mini-stat">
              <div className="mini-label">📊 Transactions</div>
              <div className="mini-val">{transactions.length}</div>
            </div>
          </div>
        </ParticleCard>

        {/* Transactions */}
        <ParticleCard className="tbl-card">
          <div className="tbl-head-row">
            <span className="section-title">🧾 Transaction History</span>
            <span className="tx-count">{transactions.length} entries</span>
          </div>
          {transactions.length === 0 ? (
            <div className="empty">No transactions yet</div>
          ) : (
            <div className="tbl">
              <div className="tbl-header">
                <div className="tbl-th">Description</div>
                <div className="tbl-th">Type</div>
                <div className="tbl-th">Date</div>
                <div className="tbl-th">Amount</div>
              </div>
              {transactions.map((tx, i) => (
                <div className="tbl-row" key={tx.transaction_id || tx.id || i} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="tx-wrap">
                    <div className="tx-ico" style={{ background: tx.type === 'credit' ? 'rgba(0,255,135,0.08)' : 'rgba(255,107,107,0.08)' }}>
                      {tx.type === 'credit' ? '⬆️' : '⬇️'}
                    </div>
                    <div>
                      <div className="tx-name">{tx.description || 'Transaction'}</div>
                      <div className="tx-date">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                    </div>
                  </div>
                  <div>
                    <span className="type-pill" style={{ color: tx.type === 'credit' ? '#00ff87' : '#ff6b6b', background: tx.type === 'credit' ? 'rgba(0,255,135,0.08)' : 'rgba(255,107,107,0.08)', border: `1px solid ${tx.type === 'credit' ? 'rgba(0,255,135,0.2)' : 'rgba(255,107,107,0.2)'}` }}>
                      {tx.type}
                    </span>
                  </div>
                  <div className="tx-date">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
                  <div className={tx.type === 'credit' ? 'amt-pos' : 'amt-neg'}>
                    {tx.type === 'credit' ? '+' : '−'}${fmt(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ParticleCard>
      </div>

      {showAdd && (
        <Modal onClose={() => { setShowAdd(false); setError('') }}>
          <div className="modal-hd">Add Funds<button className="x-btn" onClick={() => setShowAdd(false)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group"><label className="f-label">Amount ($)</label><input className="f-input" type="number" placeholder="0.00" value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })} /></div>
          <div className="f-group"><label className="f-label">Description (optional)</label><input className="f-input" placeholder="e.g. Salary deposit" value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} /></div>
          <button className="f-submit green" onClick={handleAddFunds} disabled={submitting}>{submitting ? 'Adding...' : 'Add Funds'}</button>
        </Modal>
      )}

      {showTransfer && (
        <Modal onClose={() => { setShowTransfer(false); setError('') }}>
          <div className="modal-hd">Transfer Funds<button className="x-btn" onClick={() => setShowTransfer(false)}>✕</button></div>
          {error && <div className="err-box">{error}</div>}
          <div className="f-group"><label className="f-label">Amount ($)</label><input className="f-input" type="number" placeholder="0.00" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} /></div>
          <div className="f-group"><label className="f-label">Description (optional)</label><input className="f-input" placeholder="e.g. Transfer to savings" value={transferForm.description} onChange={e => setTransferForm({ ...transferForm, description: e.target.value })} /></div>
          <button className="f-submit purple" onClick={handleTransfer} disabled={submitting}>{submitting ? 'Transferring...' : 'Transfer'}</button>
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
  .add-btn { border: none; border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; white-space: nowrap; }
  .add-btn.green { background: linear-gradient(135deg, #00a855, #00ff87); color: #000; }
  .add-btn.purple { background: linear-gradient(135deg, #7c3aed, #D89FF6); color: white; }
  .add-btn:hover { opacity: 0.85; }
  .hero-card { background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,229,255,0.1)); border: 1px solid rgba(216,159,246,0.2); border-radius: 22px; padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .hero-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
  .hero-val { font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; background: linear-gradient(135deg, #fff, #D89FF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-currency { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 6px; }
  .hero-right { display: flex; align-items: center; gap: 24px; }
  .mini-stat { text-align: center; }
  .mini-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
  .mini-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; }
  .mini-val.green { color: #00ff87; }
  .mini-val.red   { color: #ff6b6b; }
  .mini-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.08); }
  .tbl-card { background: rgba(14,6,28,0.85); border: 1px solid #1e1530; border-radius: 18px; padding: 22px; overflow: hidden; }
  .tbl-head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.6px; }
  .tx-count { font-size: 12px; color: rgba(255,255,255,0.3); }
  .tbl { display: flex; flex-direction: column; }
  .tbl-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 4px; }
  .tbl-th { font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; }
  .tbl-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 11px 10px; border-radius: 10px; align-items: center; transition: background 0.18s; animation: fadeUp 0.4s ease both; }
  .tbl-row:hover { background: rgba(255,255,255,0.025); }
  .tx-wrap { display: flex; align-items: center; gap: 11px; }
  .tx-ico { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .tx-name { font-size: 13px; font-weight: 600; }
  .tx-date { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
  .type-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: capitalize; }
  .amt-pos { font-size: 13px; font-weight: 700; color: #00ff87; }
  .amt-neg { font-size: 13px; font-weight: 700; color: #ff6b6b; }
  .empty { font-size: 13px; color: rgba(255,255,255,0.25); text-align: center; padding: 32px 0; }
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
  .f-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:11px 13px;color:white;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color 0.2s;}
  .f-input:focus{border-color:rgba(216,159,246,0.45);}
  .f-input::placeholder{color:rgba(255,255,255,0.3);}
  .f-submit{width:100%;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
  .f-submit.green{background:linear-gradient(135deg,#00a855,#00ff87);color:#000;}
  .f-submit.purple{background:linear-gradient(135deg,#7c3aed,#D89FF6);color:white;}
  .f-submit:hover{opacity:0.85;}
  .f-submit:disabled{opacity:0.5;cursor:not-allowed;}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

export default Wallet