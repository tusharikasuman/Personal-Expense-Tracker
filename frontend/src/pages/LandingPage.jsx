import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <Wrapper>
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">WalletWise</span>
        </div>
        <div className="nav-buttons">
          <button className="nav-login" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="nav-signup" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </nav>

      <div className="hero">
        <h1 className="title">
          Track.<br />
          Save.<br />
          <span className="highlight">Grow.</span>
        </h1>
        <p className="subtitle">
          Take control of your finances with powerful insights,<br />
          real-time tracking and intelligent budgeting tools.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary">Get Started</button>
          <button className="btn-secondary">Learn More</button>
        </div>
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  color: white;
  font-family: 'DM Sans', sans-serif;

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 22px;
    width: 35%;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50px;
    z-index: 10;
  }

  .logo {
    display: flex;
    align-items: center;
  }

  .logo-text {
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-buttons {
    display: flex;
    gap: 10px;
  }

  .nav-login {
    padding: 7px 18px;
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-login:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .nav-signup {
    padding: 7px 18px;
    border-radius: 50px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-signup:hover {
    opacity: 0.85;
    transform: scale(0.97);
  }

  .hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 20px;
  }

  .title {
    font-size: 96px;
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -3px;
    margin: 0;
  }

  .highlight {
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.7;
    max-width: 460px;
    margin: 0;
  }

  .hero-buttons {
    display: flex;
    gap: 12px;
  }

  .btn-primary {
    padding: 14px 36px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 30px rgba(124, 58, 237, 0.4);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(124, 58, 237, 0.6);
  }

  .btn-secondary {
    padding: 14px 36px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.75);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateY(-2px);
  }
`

export default LandingPage