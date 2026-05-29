// ─────────────────────────────────────────────────────────────────────────────
// FLIP 7  —  Mock Data
// Real deck composition per official rules (94 cards total)
// ─────────────────────────────────────────────────────────────────────────────

export const CARD_TYPES = {
  NUMBER: 'NUMBER',
  FREEZE: 'FREEZE',
  FLIP_THREE: 'FLIP_THREE',
  SECOND_CHANCE: 'SECOND_CHANCE',
  MODIFIER: 'MODIFIER',
}

export const MODIFIER_VALUES = {
  PLUS_2: '+2',
  PLUS_4: '+4',
  PLUS_6: '+6',
  PLUS_8: '+8',
  PLUS_10: '+10',
  TIMES_2: 'x2',
}

// Number cards: value N appears N times (except 0 = 1 copy, 1 = 1 copy)
// 0x1, 1x1, 2x2, 3x3, 4x4, 5x5, 6x6, 7x7, 8x8, 9x9, 10x10, 11x11, 12x12
const NUMBER_CARDS = [
  { value: 0, count: 1 },
  { value: 1, count: 1 },
  { value: 2, count: 2 },
  { value: 3, count: 3 },
  { value: 4, count: 4 },
  { value: 5, count: 5 },
  { value: 6, count: 6 },
  { value: 7, count: 7 },
  { value: 8, count: 8 },
  { value: 9, count: 9 },
  { value: 10, count: 10 },
  { value: 11, count: 11 },
  { value: 12, count: 12 },
]

// Action cards: 3 copies each
const ACTION_CARDS = [
  { type: CARD_TYPES.FREEZE, count: 3 },
  { type: CARD_TYPES.FLIP_THREE, count: 3 },
  { type: CARD_TYPES.SECOND_CHANCE, count: 3 },
]

// Modifier cards: 2 copies of each +bonus, 2 copies of x2
const MODIFIER_CARDS = [
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.PLUS_2, count: 2 },
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.PLUS_4, count: 2 },
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.PLUS_6, count: 2 },
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.PLUS_8, count: 2 },
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.PLUS_10, count: 2 },
  { type: CARD_TYPES.MODIFIER, modifier: MODIFIER_VALUES.TIMES_2, count: 2 },
]

let _cardIdCounter = 1

function makeId() {
  return `card-${_cardIdCounter++}`
}

export function buildFullDeck() {
  const deck = []

  for (const { value, count } of NUMBER_CARDS) {
    for (let i = 0; i < count; i++) {
      deck.push({ id: makeId(), type: CARD_TYPES.NUMBER, value })
    }
  }

  for (const { type, count } of ACTION_CARDS) {
    for (let i = 0; i < count; i++) {
      deck.push({ id: makeId(), type, value: null })
    }
  }

  for (const { type, modifier, count } of MODIFIER_CARDS) {
    for (let i = 0; i < count; i++) {
      deck.push({ id: makeId(), type, modifier, value: null })
    }
  }

  return deck
}

export function shuffleDeck(deck) {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Player status constants (mirrored from backend enums)
// ─────────────────────────────────────────────────────────────────────────────
export const PLAYER_STATUS = {
  ACTIVE: 'ACTIVE',
  STAYED: 'STAYED',
  BUSTED: 'BUSTED',
}

export const GAME_STATUS = {
  WAITING: 'WAITING',
  IN_ROUND: 'IN_ROUND',
  ROUND_END: 'ROUND_END',
  GAME_OVER: 'GAME_OVER',
}

export const FLIP7_BONUS = 15
export const WIN_THRESHOLD = 200