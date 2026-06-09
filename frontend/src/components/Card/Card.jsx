import { CARD_TYPES, MODIFIER_VALUES } from '../../services/mock/mockData.js'
import './Card.css'

function modifierLabel(modifier) {
  if (modifier === MODIFIER_VALUES.TIMES_2) return '×2'
  // Los modificadores planos vienen como string: '+2', '+4', etc.
  return modifier
}

const NUMBER_NAMES = {
  0: 'ZERO',
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
  6: 'SIX',
  7: 'SEVEN',
  8: 'EIGHT',
  9: 'NINE',
  10: 'TEN',
  11: 'ELEVEN',
  12: 'TWELVE',
}

function cardVisual(card) {
  if (card.type === CARD_TYPES.NUMBER) {
    return {
      variantClass: `card--number card--num-${card.value}`,
      label: '',
      icon: String(card.value),   // el número va en el icono central grande
      name: '',
      numberName: NUMBER_NAMES[card.value] || '',
    }
  }
  if (card.type === CARD_TYPES.MODIFIER) {
    return {
      variantClass: 'card--modifier',
      label: 'Modifier',
      icon: modifierLabel(card.modifier),
      name: '',
    }
  }
  if (card.type === CARD_TYPES.FREEZE) {
    return {
      variantClass: 'card--action-freeze',
      label: 'Action',
      icon: '❄',
      name: 'Freeze',
    }
  }
  if (card.type === CARD_TYPES.FLIP_THREE) {
    return {
      variantClass: 'card--action-flip-three',
      label: 'Action',
      icon: '×3',
      name: 'Flip 3',
    }
  }
  if (card.type === CARD_TYPES.SECOND_CHANCE) {
    return {
      variantClass: 'card--action-second-chance',
      label: 'Action',
      icon: '♥',
      name: '2nd Chance',
    }
  }
  return { variantClass: 'card--number', label: '', icon: '?', name: '' }
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

  const { variantClass, label, icon, name, numberName } = cardVisual(card)

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
      {/* Esquina superior izquierda */}
      <span className="card-corner card-corner--tl">{icon}</span>

      {/* Centro de la carta */}
      <span className="card-value">{icon}</span>

      {/* Nombre de la acción (solo en cartas de acción, no en números) */}
      {name && <span className="card-label">{name}</span>}

      {/* Nombre del número (ONE / TWO / …), solo en cartas numéricas */}
      {numberName && <span className="card-number-name">{numberName}</span>}

      {/* Esquina inferior derecha (invertida) */}
      <span className="card-corner card-corner--br">{icon}</span>
    </div>
  )
}