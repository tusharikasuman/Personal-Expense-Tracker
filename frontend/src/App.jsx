import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Background from './components/Background.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import Income from './pages/Income.jsx'
import Wallet from './pages/Wallet.jsx'
import Budget from './pages/Budget.jsx'

function App() {
  return (
    <BrowserRouter>
      <Background>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses"  element={<Expenses />} />
          <Route path="/income"    element={<Income />} />
          <Route path="/wallet"    element={<Wallet />} />
          <Route path="/budget"    element={<Budget />} />
        </Routes>
      </Background>
    </BrowserRouter>
  )
}

export default App