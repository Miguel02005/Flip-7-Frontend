import { CARD_TYPE, MODIFIER_LABELS, ACTION_LABELS } from '../../config/api.js'
import './Card.css'

const NUMBER_NAMES = {
  0: 'CERO',
  1: 'UNO',
  2: 'DOS',
  3: 'TRES',
  4: 'CUATRO',
  5: 'CINCO',
  6: 'SEIS',
  7: 'SIETE',
  8: 'OCHO',
  9: 'NUEVE',
  10: 'DIEZ',
  11: 'ONCE',
  12: 'DOCE',
}

function modifierLabel(modifier) {
  if (!modifier) return ''
  return MODIFIER_LABELS[modifier] || String(modifier)
}

function cardVisual(card) {
  if (card.type === CARD_TYPE.NUMBER) {
    return {
      variantClass: `card--number card--num-${card.value}`,
      icon: String(card.value),
      name: '',
      numberName: NUMBER_NAMES[card.value] || '',
    }
  }
  if (card.type === CARD_TYPE.MODIFIER) {
    return {
      variantClass: 'card--modifier',
      icon: modifierLabel(card.modifier),
      name: '',
    }
  }
  if (card.type === CARD_TYPE.FREEZE) {
    return {
      variantClass: 'card--action-freeze',
      icon: '❄',
      name: ACTION_LABELS[CARD_TYPE.FREEZE],
    }
  }
  if (card.type === CARD_TYPE.FLIP_THREE) {
    return {
      variantClass: 'card--action-flip-three',
      icon: '×3',
      name: ACTION_LABELS[CARD_TYPE.FLIP_THREE],
    }
  }
  if (card.type === CARD_TYPE.SECOND_CHANCE) {
    return {
      variantClass: 'card--action-second-chance',
      icon: '♥',
      name: ACTION_LABELS[CARD_TYPE.SECOND_CHANCE],
    }
  }
  return { variantClass: 'card--number', icon: '?', name: '' }
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

  const { variantClass, icon, name, numberName } = cardVisual(card)

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
      <span className="card-corner card-corner--tl">{icon}</span>
      <span className="card-value">{icon}</span>
      {name && <span className="card-label">{name}</span>}
      {numberName && <span className="card-number-name">{numberName}</span>}
      <span className="card-corner card-corner--br">{icon}</span>
    </div>
  )
}
