import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Background from './components/Background.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'

function App() {
  return (
    <BrowserRouter>
      <Background>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income"  element={<div style={{color:'white',padding:'100px 32px'}}>Income coming soon</div>} />
          <Route path="/budget"  element={<div style={{color:'white',padding:'100px 32px'}}>Budget coming soon</div>} />
          <Route path="/wallet"  element={<div style={{color:'white',padding:'100px 32px'}}>Wallet coming soon</div>} />
          <Route path="/savings" element={<div style={{color:'white',padding:'100px 32px'}}>Savings coming soon</div>} />
          <Route path="/bills"   element={<div style={{color:'white',padding:'100px 32px'}}>Bills coming soon</div>} />
        </Routes>
      </Background>
    </BrowserRouter>
  )
}

export default App