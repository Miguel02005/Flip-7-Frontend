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
  // Sin partida iniciada todavía
  if (status === STATUS.IDLE || status === STATUS.WAITING) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Configuración de partida</div>
        <div className="action-panel__message">
          Configura los jugadores en el panel de la izquierda y luego inicia la
          partida.
        </div>
      </div>
    )
  }

  // Ronda recién terminada: mostrar resumen y permitir iniciar la siguiente
  if (status === STATUS.ROUND_END) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Ronda completada</div>
        <div className="action-panel__message">
          La ronda terminó. Inicia la siguiente ronda cuando estés listo.
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--primary"
            onClick={onStartNextRound}
            disabled={loading}
            data-testid="start-next-round"
          >
            {loading ? 'Procesando...' : 'Iniciar siguiente ronda'}
          </button>
        </div>
      </div>
    )
  }

  // Partida terminada
  if (status === STATUS.GAME_OVER) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Fin de la partida</div>
        <div className="action-panel__message">
          Un jugador alcanzó 200 puntos. Mira el banner del ganador arriba.
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--primary"
            onClick={onNewGame}
            data-testid="new-game"
          >
            Nueva partida
          </button>
        </div>
      </div>
    )
  }

  // En ronda: acción pendiente — el jugador origen debe elegir objetivo.
  // Mostramos también la carta jugada visualmente con su nombre real.
  if (pendingAction) {
    return (
      <div className="action-panel" data-testid="pending-action">
        <div className="action-panel__title">Carta de acción jugada</div>
        <ActionCardReveal pendingAction={pendingAction} />
        <div className="action-panel__message">
          <strong>{pendingAction.sourcePlayerName || 'Un jugador'}</strong> jugó
          una <strong>{actionLabel(pendingAction.type)}</strong>. Haz clic en un
          jugador objetivo para aplicarla. (Puedes elegirte a ti mismo.)
        </div>
        <div className="action-panel__buttons">
          <button
            className="btn btn--secondary"
            onClick={() => onApplyAction(pendingAction.sourcePlayerId)}
            data-testid="target-self"
          >
            Elegirme ({pendingAction.sourcePlayerName})
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
            'No hay otros jugadores activos; debes elegirte a ti mismo.'}
        </div>
      </div>
    )
  }

  // En ronda: sin acción pendiente — controles del jugador actual
  if (!currentPlayer) {
    return (
      <div className="action-panel">
        <div className="action-panel__title">Esperando...</div>
      </div>
    )
  }

  return (
    <div className="action-panel" data-testid="action-panel">
      <div className="action-panel__title">
        Turno de {currentPlayer.name}
      </div>
      <div className="action-panel__buttons">
        <button
          className="btn btn--draw"
          onClick={onDraw}
          disabled={loading}
          data-testid="draw-card"
        >
          <span className="btn__icon" aria-hidden="true">＋</span>
          {loading ? 'Robando…' : 'Robar carta'}
        </button>
        <button
          className="btn btn--stay"
          onClick={onStay}
          disabled={loading}
          data-testid="stay"
        >
          <span className="btn__icon" aria-hidden="true">✋</span>
          Plantarse
        </button>
      </div>
    </div>
  )
}

function actionLabel(type) {
  if (type === CARD_TYPE.FREEZE) return ACTION_LABELS[CARD_TYPE.FREEZE]
  if (type === CARD_TYPE.FLIP_THREE) return ACTION_LABELS[CARD_TYPE.FLIP_THREE]
  if (type === CARD_TYPE.SECOND_CHANCE) return ACTION_LABELS[CARD_TYPE.SECOND_CHANCE]
  return 'Acción'
}
