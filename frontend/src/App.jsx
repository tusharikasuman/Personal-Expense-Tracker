import { useState } from 'react'
import './App.css'
import Login from './components/Login.jsx'
import Background from './components/Background.jsx'
import LandingPage from './pages/LandingPage.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Background>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Background>
    </BrowserRouter>
  )
}

export default App