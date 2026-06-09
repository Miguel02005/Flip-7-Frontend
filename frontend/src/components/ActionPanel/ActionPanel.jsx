import { CARD_TYPE, ACTION_LABELS, STATUS } from '../../config/api.js'
import ActionCardReveal from '../ActionCardReveal/ActionCardReveal.jsx'
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
  onNewGame,
}) {
  // No game started yet
  if (status === STATUS.IDLE || status === STATUS.WAITING) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Game Setup</div>
        <div className="action-panel__message">
          Configure the players in the panel on the left and then start the
          game.
        </div>
      </div>
    )
  }

  // Round just ended: show summary and allow starting the next one
  if (status === STATUS.ROUND_END) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Round Complete</div>
        <div className="action-panel__message">
          The round has ended. Start the next round whenever you're ready.
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--primary"
            onClick={onStartNextRound}
            disabled={loading}
            data-testid="start-next-round"
          >
            {loading ? 'Processing...' : 'Start Next Round'}
          </button>
        </div>
      </div>
    )
  }

  // Game over
  if (status === STATUS.GAME_OVER) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Game Over</div>
        <div className="action-panel__message">
          A player reached 200 points. Check the winner banner above.
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

  // In round: pending action — the source player must choose a target.
  // We also display the played card visually with its real name.
  if (pendingAction) {
    return (
      <div className="action-panel" data-testid="pending-action">
        <div className="action-panel__title">Action Card Played</div>
        <ActionCardReveal pendingAction={pendingAction} />
        <div className="action-panel__message">
          <strong>{pendingAction.sourcePlayerName || 'A player'}</strong> played
          a <strong>{actionLabel(pendingAction.type)}</strong>. Click on a
          target player to apply it. (You may choose yourself.)
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--secondary"
            onClick={() => onApplyAction(pendingAction.sourcePlayerId)}
            data-testid="target-self"
          >
            Choose me ({pendingAction.sourcePlayerName})
          </button>
        </div>
        <div
          className="action-panel__message"
          style={{ fontSize: 13, opacity: 0.7 }}
        >
          {activePlayers
            .filter((p) => p.id !== pendingAction.sourcePlayerId)
            .map((p) => p.name)
            .join(', ') ||
            'No other active players; you must choose yourself.'}
        </div>
      </div>
    )
  }

  // In round: no pending action — current player controls
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
  if (type === CARD_TYPE.FREEZE) return ACTION_LABELS[CARD_TYPE.FREEZE]
  if (type === CARD_TYPE.FLIP_THREE) return ACTION_LABELS[CARD_TYPE.FLIP_THREE]
  if (type === CARD_TYPE.SECOND_CHANCE) return ACTION_LABELS[CARD_TYPE.SECOND_CHANCE]
  return 'Action'
}
