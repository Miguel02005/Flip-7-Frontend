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
        <div className="winner-modal__podium">
          {sorted.slice(0, 3).map((p, idx) => (
            <div
              key={p.id}
              className={`winner-modal__podium-step winner-modal__podium-step--${idx + 1}`}
            >
              <div className="winner-modal__podium-medal">
                {idx + 1}
              </div>
              <div className="winner-modal__podium-name">{p.name}</div>
              <div className="winner-modal__podium-score">{p.totalScore}</div>
            </div>
          ))}
        </div>
        {sorted.length > 3 && (
          <div className="winner-modal__scores">
            {sorted.slice(3).map((p) => (
              <div key={p.id} className="winner-modal__score-row">
                <span>{p.name}</span>
                <strong>{p.totalScore}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="winner-modal__actions">
          <button className="winner-modal__play-again" onClick={onClose}>
            Play Again
          </button>
          <button className="winner-modal__back" onClick={onClose}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
