import './WinnerModal.css'

export default function WinnerModal({ winner, players, onClose }) {
  if (!winner) return null

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore)

  return (
    <div
      className="winner-modal"
      data-testid="winner-modal"
      onClick={onClose}
    >
      <div
        className="winner-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="winner-modal__title">🏆 Game Over</div>
        <div className="winner-modal__name">{winner.name} wins!</div>
        <div className="winner-modal__score">
          Final score: <strong>{winner.totalScore}</strong> points
        </div>
        <div className="winner-modal__scores">
          {sorted.map((p) => (
            <div key={p.id}>
              <span>{p.name}</span>
              <strong>{p.totalScore}</strong>
            </div>
          ))}
        </div>
        <button className="winner-modal__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
