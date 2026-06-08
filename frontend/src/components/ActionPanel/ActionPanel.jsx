import { CARD_TYPES, PLAYER_STATUS } from '../../services/mock/mockData.js'
import './ActionPanel.css'

export default function ActionPanel({
  status,
  currentPlayer,
  pendingAction,
  activePlayers,
  onDraw,
  onStay,
  onApplyAction,
  loading,
  onStartNextRound,
  onStartFirstRound,
  onNewGame,
}) {
  // No game started yet
  if (status === 'IDLE' || status === 'WAITING') {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Game Setup</div>
        <div className="action-panel__message">
          Configure the players in the setup card on the left, then start the game.
        </div>
      </div>
    )
  }

  // Round just ended — show summary and offer to start the next
  if (status === 'ROUND_END') {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Round Complete</div>
        <div className="action-panel__message">
          Round is over. Start the next round when ready.
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--primary"
            onClick={onStartNextRound}
            disabled={loading}
            data-testid="start-next-round"
          >
            {loading ? 'Working...' : 'Start Next Round'}
          </button>
        </div>
      </div>
    )
  }

  // Game over
  if (status === 'GAME_OVER') {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Game Over</div>
        <div className="action-panel__message">
          A player has reached 200 points. See the winner banner above.
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--primary"
            onClick={onNewGame}
            data-testid="new-game"
          >
            New Game
          </button>
        </div>
      </div>
    )
  }

  // In round: pending action — let the source player pick a target
  if (pendingAction) {
    return (
      <div className="action-panel" data-testid="pending-action">
        <div className="action-panel__title">Action Card Played</div>
        <div className="action-panel__message">
          <strong>{pendingAction.sourcePlayerName || 'A player'}</strong> played a{' '}
          <strong>{actionLabel(pendingAction.type)}</strong>. Click a target player
          on the table to apply it. (You can target yourself.)
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--secondary"
            onClick={() => onApplyAction(pendingAction.sourcePlayerId)}
            data-testid="target-self"
          >
            Target Self ({pendingAction.sourcePlayerName})
          </button>
        </div>
        <div className="action-panel__message" style={{ fontSize: 13, opacity: 0.7 }}>
          {activePlayers
            .filter((p) => p.id !== pendingAction.sourcePlayerId)
            .map((p) => p.name)
            .join(', ') || 'No other active players — must target self.'}
        </div>
      </div>
    )
  }

  // In round: no pending action — show current player's controls
  if (!currentPlayer) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Waiting...</div>
      </div>
    )
  }

  return (
    <div className="action-panel" data-testid="action-panel">
      <div className="action-panel__title">
        {currentPlayer.name}'s Turn
      </div>
      <div className="action-panel__buttons">
        <button
          className="btn btn--draw"
          onClick={onDraw}
          disabled={loading}
          data-testid="draw-card"
        >
          <span className="btn__icon" aria-hidden="true">＋</span>
          {loading ? 'Drawing…' : 'Draw Card'}
        </button>
        <button
          className="btn btn--stay"
          onClick={onStay}
          disabled={loading}
          data-testid="stay"
        >
          <span className="btn__icon" aria-hidden="true">✋</span>
          Stay
        </button>
      </div>
    </div>
  )
}

function actionLabel(type) {
  if (type === CARD_TYPES.FREEZE) return 'Freeze'
  if (type === CARD_TYPES.FLIP_THREE) return 'Flip Three'
  if (type === CARD_TYPES.SECOND_CHANCE) return 'Second Chance'
  return 'Action'
}
