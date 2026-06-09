// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — API configuration and domain constants
//
// The constants mirror the backend enums (GameStatus, CardType,
// PlayerStatus, ModifierType) without inventing values. Any change in
// the backend must be reflected here.
// ─────────────────────────────────────────────────────────────────────────────

// Base URL for all HTTP calls.
//
// The Spring Boot backend exposes its endpoints directly under /games
// (without the /api prefix). That's why API_BASE must default to an empty
// string. In development, the Vite dev server intercepts /games and
// redirects to http://localhost:8080. In production, VITE_API_BASE can
// be overridden with the absolute backend URL, e.g. http://localhost:8080
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Default timeout for all requests.
export const API_TIMEOUT_MS = 15000

// Point threshold to win the game (matches the backend).
export const WIN_THRESHOLD = 200

// ─── Backend enums (mirrors) ─────────────────────────────────────────────────

export const STATUS = Object.freeze({
  IDLE: 'IDLE',
  WAITING: 'WAITING',
  IN_ROUND: 'IN_ROUND',
  ROUND_END: 'ROUND_END',
  GAME_OVER: 'GAME_OVER',
})

export const CARD_TYPE = Object.freeze({
  NUMBER: 'NUMBER',
  FREEZE: 'FREEZE',
  FLIP_THREE: 'FLIP_THREE',
  SECOND_CHANCE: 'SECOND_CHANCE',
  MODIFIER: 'MODIFIER',
})

export const CARD_KIND = Object.freeze({
  NUMBER: 'NUMBER',
  ACTION: 'ACTION',
  MODIFIER: 'MODIFIER',
})

export const PLAYER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  STAYED: 'STAYED',
  BUSTED: 'BUSTED',
})

export const MODIFIER_TYPE = Object.freeze({
  PLUS_2: 'PLUS_2',
  PLUS_4: 'PLUS_4',
  PLUS_6: 'PLUS_6',
  PLUS_8: 'PLUS_8',
  PLUS_10: 'PLUS_10',
  TIMES_2: 'TIMES_2',
})

// Human-readable label to display in the UI for a modifier.
export const MODIFIER_LABELS = Object.freeze({
  [MODIFIER_TYPE.PLUS_2]: '+2',
  [MODIFIER_TYPE.PLUS_4]: '+4',
  [MODIFIER_TYPE.PLUS_6]: '+6',
  [MODIFIER_TYPE.PLUS_8]: '+8',
  [MODIFIER_TYPE.PLUS_10]: '+10',
  [MODIFIER_TYPE.TIMES_2]: '×2',
})

// Human-readable label for each action card type.
// IMPORTANT: these are proper names from the game and are NOT translated.
export const ACTION_LABELS = Object.freeze({
  [CARD_TYPE.FREEZE]: 'Freeze',
  [CARD_TYPE.FLIP_THREE]: 'Flip Three',
  [CARD_TYPE.SECOND_CHANCE]: 'Second Chance',
})

// Human-readable label for each game status.
export const STATUS_LABELS = Object.freeze({
  [STATUS.WAITING]: 'Waiting to start',
  [STATUS.IN_ROUND]: 'In progress',
  [STATUS.ROUND_END]: 'Round ended',
  [STATUS.GAME_OVER]: 'Game over',
})

// Human-readable label for each player status.
export const PLAYER_STATUS_LABELS = Object.freeze({
  [PLAYER_STATUS.ACTIVE]: 'ACTIVE',
  [PLAYER_STATUS.STAYED]: 'STAYED',
  [PLAYER_STATUS.BUSTED]: 'BUSTED',
})
