import { CARD_TYPES, MODIFIER_VALUES } from '../../services/mock/mockData.js'
import './Card.css'

function modifierLabel(modifier) {
  if (modifier === MODIFIER_VALUES.TIMES_2) return 'x2'
  return modifier
}

export default function Card({
  card,
  small = false,
  onClick,
  selected = false,
  highlighted = false,
  faceDown = false,
}) {
  if (faceDown) {
    return (
      <div
        className={['card', small ? 'card--small' : '', 'card--back']
          .filter(Boolean)
          .join(' ')}
      />
    )
  }

  if (!card) return null

  let variantClass = ''
  let label = ''
  let value = ''

  if (card.type === CARD_TYPES.NUMBER) {
    variantClass = 'card--number'
    value = String(card.value)
  } else if (card.type === CARD_TYPES.MODIFIER) {
    variantClass = 'card--modifier'
    label = 'Modifier'
    value = modifierLabel(card.modifier)
  } else if (card.type === CARD_TYPES.FREEZE) {
    variantClass = 'card--action-freeze'
    label = 'Action'
    value = 'Freeze'
  } else if (card.type === CARD_TYPES.FLIP_THREE) {
    variantClass = 'card--action-flip-three'
    label = 'Action'
    value = 'Flip 3'
  } else if (card.type === CARD_TYPES.SECOND_CHANCE) {
    variantClass = 'card--action-second-chance'
    label = 'Action'
    value = '2nd Chance'
  } else {
    variantClass = 'card--number'
    value = '?'
  }

  const className = [
    'card',
    variantClass,
    small ? 'card--small' : '',
    onClick ? 'card--clickable' : '',
    selected ? 'card--selected' : '',
    highlighted ? 'card--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={`card-${card.id}`}
      data-card-type={card.type}
    >
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
    </div>
  )
}
