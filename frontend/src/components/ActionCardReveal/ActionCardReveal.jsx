import { CARD_TYPE, ACTION_LABELS } from '../../config/api.js'
import './ActionCardReveal.css'

/**
 * ActionCardReveal — muestra visualmente la carta de acción jugada.
 *
 * El backend no persiste las cartas FREEZE/FLIP_THREE/SECOND_CHANCE en
 * players[].cards (se descartan tras jugarse), sino en pendingAction.card.
 * Este componente toma pendingAction y muestra la carta real con su
 * nombre propio y una animación de entrada para que el usuario la vea
 * claramente antes de elegir objetivo.
 *
 * Solo se muestra cuando hay un pendingAction (es decir, cuando una carta
 * de acción acaba de ser jugada y aún no se ha resuelto).
 */
export default function ActionCardReveal({ pendingAction }) {
  if (!pendingAction || !pendingAction.card) return null

  const card = pendingAction.card
  const type = card.type || pendingAction.type
  const name = ACTION_LABELS[type] || 'Acción'
  const variantClass = `action-card-reveal--${String(type).toLowerCase()}`
  const remaining =
    typeof pendingAction.remainingCards === 'number'
      ? pendingAction.remainingCards
      : 0

  return (
    <div
      className={`action-card-reveal ${variantClass}`}
      data-testid="action-card-reveal"
      data-card-type={type}
    >
      <div className="action-card-reveal__card">
        <span className="action-card-reveal__corner-tl">{iconFor(type)}</span>
        <span className="action-card-reveal__value">{iconFor(type)}</span>
        {type === CARD_TYPE.SECOND_CHANCE && (
          <span className="action-card-reveal__label">Second Chance</span>
        )}
        {type === CARD_TYPE.FREEZE && (
          <span className="action-card-reveal__label">Freeze</span>
        )}
        {type === CARD_TYPE.FLIP_THREE && (
          <>
            <span className="action-card-reveal__label">Flip Three</span>
            {remaining > 0 && (
              <span className="action-card-reveal__remaining">
                ×{remaining}
              </span>
            )}
          </>
        )}
        <span className="action-card-reveal__corner-br">{iconFor(type)}</span>
      </div>
      <div className="action-card-reveal__caption">
        <strong>{name}</strong>
        {type === CARD_TYPE.FLIP_THREE && remaining > 0 &&
          ` — ${remaining} carta${remaining === 1 ? '' : 's'} por robar`}
        {type === CARD_TYPE.SECOND_CHANCE &&
          ' — pasa al siguiente jugador activo'}
        {type === CARD_TYPE.FREEZE && ' — elige a quién congelar'}
      </div>
    </div>
  )
}

function iconFor(type) {
  if (type === CARD_TYPE.FREEZE) return '❄'
  if (type === CARD_TYPE.FLIP_THREE) return '×3'
  if (type === CARD_TYPE.SECOND_CHANCE) return '♥'
  return '?'
}
