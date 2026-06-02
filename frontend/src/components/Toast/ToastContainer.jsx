import { useEffect } from 'react'
import { useGame, useGameActions } from '../../store/gameContext.jsx'
import './Toast.css'

export default function ToastContainer() {
  const { toasts } = useGame()
  const { removeToast } = useGameActions()

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) =>
      setTimeout(() => removeToast(t.id), 3500)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-container" data-testid="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.variant || 'info'}`}
          data-testid="toast"
        >
          <span>{t.message}</span>
          <button
            className="toast__close"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
