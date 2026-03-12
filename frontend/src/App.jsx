import { useState } from 'react'
import './App.css'
import Login from './pages/Login.jsx'
import Background from './components/Background.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Background>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Background>
    </BrowserRouter>
  )
}

export default App