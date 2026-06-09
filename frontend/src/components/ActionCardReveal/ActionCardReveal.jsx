import { CARD_TYPE, ACTION_LABELS } from '../../config/api.js'
import './ActionCardReveal.css'

/**
 * ActionCardReveal — visually displays the played action card.
 *
 * The backend does not persist FREEZE/FLIP_THREE/SECOND_CHANCE cards in
 * players[].cards (they are discarded after being played), but rather in
 * pendingAction.card. This component takes pendingAction and shows the
 * actual card with its own name and an entrance animation so the user
 * can see it clearly before choosing a target.
 *
 * It is only shown when there is a pendingAction (i.e. when an action
 * card has just been played and has not yet been resolved).
 */
export default function ActionCardReveal({ pendingAction }) {
  if (!pendingAction || !pendingAction.card) return null

  const card = pendingAction.card
  const type = card.type || pendingAction.type
  const name = ACTION_LABELS[type] || 'Action'
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
          ` — ${remaining} card${remaining === 1 ? '' : 's'} left to draw`}
        {type === CARD_TYPE.SECOND_CHANCE &&
          ' — passes to the next active player'}
        {type === CARD_TYPE.FREEZE && ' — choose who to freeze'}
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
