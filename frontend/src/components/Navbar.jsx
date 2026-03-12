import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Income', path: '/income' },
    { label: 'Budget', path: '/budget' },
    { label: 'Wallet', path: '/wallet' },
    { label: 'Savings', path: '/savings' },
    { label: 'Bills', path: '/bills' },
  ]

  return (
    <Wrapper>
      <div className="logo" onClick={() => navigate('/dashboard')}>
        <span className="logo-text">💰 WalletWise</span>
      </div>

      <div className="floating-nav">
        {navItems.map((item) => (
          <span
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </span>
        ))}
      </div>

      <div className="nav-right">
        <div className="avatar">T</div>
        <button className="logout-btn" onClick={() => navigate('/')}>Logout</button>
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  color: white;

  .logo {
    cursor: pointer;
    font-size: 17px;
    font-weight: 800;
    background: linear-gradient(135deg, #D89FF6, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    min-width: 160px;
  }

  .floating-nav {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 5px 8px;
  }

  .nav-item {
    padding: 6px 13px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .nav-item:hover {
    background: rgba(255,255,255,0.08);
    color: white;
  }

  .nav-item.active {
    background: rgba(216,159,246,0.15);
    color: #D89FF6;
    border-color: rgba(216,159,246,0.25);
    font-weight: 600;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 160px;
    justify-content: flex-end;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #D89FF6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 2px solid rgba(216,159,246,0.3);
  }

  .logout-btn {
    padding: 6px 14px;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .logout-btn:hover {
    background: rgba(255,107,107,0.1);
    border-color: rgba(255,107,107,0.3);
    color: #ff6b6b;
  }
`

export default Navbar