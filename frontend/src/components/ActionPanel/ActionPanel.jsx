import { CARD_TYPE, ACTION_LABELS, STATUS } from '../../config/api.js'
import ActionCardReveal from '../ActionCardReveal/ActionCardReveal.jsx'
import './ActionPanel.css'

/**
 * ActionPanel — persistent game HUD bar.
 *
 * The component always renders a single bar at the bottom of the screen,
 * regardless of game status. The bar contains a "turn" pill on the left
 * (current player + status) and an action cluster on the right. The same
 * callbacks fire from the same buttons; only the surrounding layout
 * changes.
 */
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
  // Always render the bar wrapper. The branch only decides what to show
  // inside the [turn pill] and [action cluster] slots.
  return (
    <div className="action-bar" data-testid="action-bar">
      <div className="action-bar__inner">
        {renderTurnPill({ status, currentPlayer, pendingAction })}
        {renderActions({
          status,
          currentPlayer,
          pendingAction,
          activePlayers,
          loading,
          onDraw,
          onStay,
          onApplyAction,
          onStartNextRound,
          onNewGame,
        })}
      </div>
    </div>
  )
}

/* ─── Turn pill (left side of the bar) ──────────────────────────────────── */

function renderTurnPill({ status, currentPlayer, pendingAction }) {
  // Pending action: the source player needs to choose a target.
  if (pendingAction) {
    return (
      <div className="action-bar__turn action-bar__turn--pending">
        <div className="action-bar__turn-label">Action Required</div>
        <div className="action-bar__turn-name">
          {pendingAction.sourcePlayerName || 'A player'}
        </div>
      </div>
    )
  }

  // In round: show the current player.
  if (status === STATUS.IN_ROUND && currentPlayer) {
    return (
      <div className="action-bar__turn action-bar__turn--active">
        <div className="action-bar__turn-label">Current Turn</div>
        <div className="action-bar__turn-name">{currentPlayer.name}</div>
      </div>
    )
  }

  // Round complete: show the next-round prompt.
  if (status === STATUS.ROUND_END) {
    return (
      <div className="action-bar__turn action-bar__turn--roundend">
        <div className="action-bar__turn-label">Round Complete</div>
        <div className="action-bar__turn-name">Start the next round</div>
      </div>
    )
  }

  // Game over.
  if (status === STATUS.GAME_OVER) {
    return (
      <div className="action-bar__turn action-bar__turn--gameover">
        <div className="action-bar__turn-label">Game Over</div>
        <div className="action-bar__turn-name">A player reached 200</div>
      </div>
    )
  }

  // Idle / waiting.
  return (
    <div className="action-bar__turn action-bar__turn--idle">
      <div className="action-bar__turn-label">Game Setup</div>
      <div className="action-bar__turn-name">Configure the players</div>
    </div>
  )
}

/* ─── Action cluster (right side of the bar) ────────────────────────────── */

function renderActions({
  status,
  currentPlayer,
  pendingAction,
  activePlayers,
  loading,
  onDraw,
  onStay,
  onApplyAction,
  onStartNextRound,
  onNewGame,
}) {
  // Idle / waiting: no buttons — the message in the pill is enough.
  if (status === STATUS.IDLE || status === STATUS.WAITING) {
    return null
  }

  // Round complete: single "Start Next Round" button.
  if (status === STATUS.ROUND_END) {
    return (
      <div className="action-bar__buttons">
        <button
          className="btn btn--primary"
          onClick={onStartNextRound}
          disabled={loading}
          data-testid="start-next-round"
        >
          {loading ? 'Processing...' : 'Start Next Round'}
        </button>
      </div>
    )
  }

  // Game over: single "New Game" button.
  if (status === STATUS.GAME_OVER) {
    return (
      <div className="action-bar__buttons">
        <button
          className="btn btn--primary"
          onClick={onNewGame}
          data-testid="new-game"
        >
          New Game
        </button>
      </div>
    )
  }

  // Pending action: the action card reveal + a "Choose me" shortcut.
  if (pendingAction) {
    return (
      <div className="action-bar__buttons action-bar__buttons--stacked">
        <div className="action-bar__pending-card">
          <ActionCardReveal pendingAction={pendingAction} />
        </div>
        <div className="action-bar__pending-info">
          <strong>{pendingAction.sourcePlayerName || 'A player'}</strong>{' '}
          played a <strong>{actionLabel(pendingAction.type)}</strong>. Click
          a target player to apply it.
        </div>
        <div className="action-bar__pending-row">
          <button
            className="btn btn--secondary"
            onClick={() => onApplyAction(pendingAction.sourcePlayerId)}
            data-testid="target-self"
          >
            Choose me ({pendingAction.sourcePlayerName})
          </button>
          <span className="action-bar__pending-hint">
            {activePlayers
              .filter((p) => p.id !== pendingAction.sourcePlayerId)
              .map((p) => p.name)
              .join(', ') ||
              'No other active players; you must choose yourself.'}
          </span>
        </div>
      </div>
    )
  }

  // In round: no pending action — Draw and Stay.
  if (!currentPlayer) {
    return (
      <div className="action-bar__buttons">
        <span className="action-bar__waiting">Waiting...</span>
      </div>
    )
  }

  return (
    <div className="action-bar__buttons" data-testid="action-panel">
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
  )
}

function actionLabel(type) {
  if (type === CARD_TYPE.FREEZE) return ACTION_LABELS[CARD_TYPE.FREEZE]
  if (type === CARD_TYPE.FLIP_THREE) return ACTION_LABELS[CARD_TYPE.FLIP_THREE]
  if (type === CARD_TYPE.SECOND_CHANCE) return ACTION_LABELS[CARD_TYPE.SECOND_CHANCE]
  return 'Action'
}
