import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Stepper, { Step } from '../components/Stepper'
import API from '../api/axios.js'

const Signup = () => {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ firstname: '', lastname: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  // ── Validate step 1 before allowing Continue ──
  const validateStep1 = () => {
    if (!form.firstname.trim() || !form.lastname.trim()) {
      setError('Please enter your first and last name'); return false
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Please enter a valid email address'); return false
    }
    setError(''); return true
  }

  // ── Validate step 2 before allowing Continue ──
  const validateStep2 = () => {
    if (!form.password) {
      setError('Please enter a password'); return false
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return false
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return false
    }
    setError(''); return true
  }

  // ── Called when final step Finish is clicked ──
  const handleRegister = async () => {
    try {
      setLoading(true)
      setError('')
      await API.post('/auth/register', {
        firstname: form.firstname,
        lastname:  form.lastname,
        email:     form.email,
        password:  form.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <div className="card">
        <div className="logo">💰 WalletWise</div>
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Get started in just a few steps</p>

        {error && <div className="error-box">{error}</div>}

        <Stepper
          initialStep={1}
          backButtonText="← Back"
          nextButtonText="Continue →"
          onStepChange={() => setError('')}
          onFinalStepCompleted={handleRegister}
          validateStep={step => {
            if (step === 1) return validateStep1()
            if (step === 2) return validateStep2()
            return true
          }}
        >
          {/* Step 1 — Personal Info */}
          <Step>
            <h2>Who are you? 👋</h2>
            <p>Let's start with your basic info</p>
            <div className="step-fields">
              <div className="field-row">
                <div className="field">
                  <label className="label">First Name</label>
                  <input className="f-input" name="firstname" placeholder="First Name" value={form.firstname} onChange={handleChange} />
                </div>
                <div className="field">
                  <label className="label">Last Name</label>
                  <input className="f-input" name="lastname" placeholder="Last Name" value={form.lastname} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label className="label">Email Address</label>
                <input className="f-input" name="email" type="email" placeholder="abc@example.com" value={form.email} onChange={handleChange} />
              </div>
            </div>
          </Step>

          {/* Step 2 — Password */}
          <Step>
            <h2>Set your password 🔒</h2>
            <p>Choose a strong password to protect your account</p>
            <div className="step-fields">
              <div className="field">
                <label className="label">Password</label>
                <input className="f-input" name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Confirm Password</label>
                <input className="f-input" name="confirm" type="password" placeholder="Repeat your password" value={form.confirm} onChange={handleChange} />
              </div>
            </div>
          </Step>

          {/* Step 3 — Review & Submit */}
          <Step>
            <h2>You're all set! 🎉</h2>
            <p>Review your details before creating your account</p>
            <div className="review-box">
              <div className="review-row">
                <span className="review-label">Name</span>
                <span className="review-val">{form.firstname} {form.lastname}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Email</span>
                <span className="review-val">{form.email || '—'}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Password</span>
                <span className="review-val">{'•'.repeat(form.password.length) || '—'}</span>
              </div>
            </div>
            {loading && <div className="loading-text">Creating your account...</div>}
          </Step>
        </Stepper>

        <p className="bottom">
          Already have an account?{' '}
          <span className="link" onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'DM Sans', sans-serif;

  .card {
    background: rgba(10,0,22,0.85);
    border: 1px solid rgba(216,159,246,0.2);
    border-radius: 24px;
    padding: 40px 36px;
    width: 100%;
    max-width: 500px;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 60px rgba(124,58,237,0.15);
  }

  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    background: linear-gradient(135deg, #D89FF6, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
    text-align: center;
  }

  .title {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: white;
    text-align: center;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    text-align: center;
    margin-bottom: 28px;
  }

  .error-box {
    background: rgba(255,107,107,0.1);
    border: 1px solid rgba(255,107,107,0.3);
    border-radius: 10px;
    padding: 10px 14px;
    color: #ff6b6b;
    font-size: 12.5px;
    text-align: center;
    margin-bottom: 16px;
  }

  .loading-text {
    text-align: center;
    font-size: 13px;
    color: #D89FF6;
    margin-top: 12px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .step-fields { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 7px; }
  .label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }

  .f-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 11px 14px;
    color: white;
    font-size: 13px;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .f-input:focus { border-color: rgba(216,159,246,0.5); }
  .f-input::placeholder { color: rgba(255,255,255,0.25); }

  .review-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 6px;
  }
  .review-row { display: flex; justify-content: space-between; align-items: center; }
  .review-label { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .review-val { font-size: 13px; color: white; font-weight: 600; }

  .bottom {
    text-align: center;
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    margin-top: 20px;
  }
  .link { color: #D89FF6; cursor: pointer; font-weight: 600; }
  .link:hover { text-decoration: underline; }
`

export default Signup