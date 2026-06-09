import { useCallback, useLayoutEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './store/gameContext.jsx'
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ToastContainer from './components/Toast/ToastContainer.jsx'
import './App.css'

const THEME_KEY = 'flip7-theme'
const THEME_LIGHT = 'theme-light'
const THEME_DARK = 'theme-dark'

function readStoredTheme() {
  if (typeof window === 'undefined') return THEME_LIGHT
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === THEME_DARK || stored === THEME_LIGHT) return stored
  } catch {
    /* localStorage puede no estar disponible (p. ej. modo privado); fallback */
  }
  return THEME_LIGHT
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === THEME_DARK) {
    root.classList.add(THEME_DARK)
    root.classList.remove(THEME_LIGHT)
  } else {
    root.classList.add(THEME_LIGHT)
    root.classList.remove(THEME_DARK)
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(readStoredTheme)

  // Aplica el tema sincrónicamente antes del repintado para evitar parpadeo
  // al navegar entre páginas o en la carga inicial.
  useLayoutEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignorar errores de almacenamiento */
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === THEME_DARK ? THEME_LIGHT : THEME_DARK))
  }, [])

  const isDark = theme === THEME_DARK
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      data-testid="theme-toggle"
    >
      <span aria-hidden="true">{isDark ? '☀' : '🌙'}</span>
    </button>
  )
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <ThemeToggle />
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
