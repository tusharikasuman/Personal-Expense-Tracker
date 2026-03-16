import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Background from './components/Background.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import Income from './pages/Income.jsx'
import Wallet from './pages/Wallet.jsx'
import Budget from './pages/Budget.jsx'
import Savings from './pages/Savings.jsx'
import Bills from './pages/Bills.jsx'
import { useAuth } from './context/AuthContext.jsx'

const PrivateRoute = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Background>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Signup />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/expenses"  element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/income"    element={<PrivateRoute><Income /></PrivateRoute>} />
          <Route path="/wallet"    element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/budget"    element={<PrivateRoute><Budget /></PrivateRoute>} />
          <Route path="/savings"   element={<PrivateRoute><Savings /></PrivateRoute>} />
          <Route path="/bills"     element={<PrivateRoute><Bills /></PrivateRoute>} />
        </Routes>
      </Background>
    </BrowserRouter>
  )
}

export default App