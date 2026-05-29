import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './store/gameContext.jsx'
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ToastContainer from './components/Toast/ToastContainer.jsx'
import './App.css'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}