// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — Configuración de la API y constantes del dominio
//
// Las constantes espejan los enums del backend (GameStatus, CardType,
// PlayerStatus, ModifierType) sin inventar valores. Cualquier cambio en
// el backend debe reflejarse aquí.
// ─────────────────────────────────────────────────────────────────────────────

// Base URL para todas las llamadas HTTP.
//
// El backend Spring Boot expone sus endpoints directamente bajo /games
// (sin prefijo /api). Por eso API_BASE debe ser string vacío por defecto.
// En desarrollo, el dev server de Vite intercepta /games y lo redirige a
// http://localhost:8080. En producción, VITE_API_BASE puede sobreescribirse
// con la URL absoluta del backend, p. ej. http://localhost:8080
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Timeout por defecto para todas las peticiones.
export const API_TIMEOUT_MS = 15000

// Umbral de puntos para ganar la partida (coincide con el backend).
export const WIN_THRESHOLD = 200

// ─── Enums del backend (espejos) ─────────────────────────────────────────────

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

// Etiqueta legible para mostrar en la UI de un modificador.
export const MODIFIER_LABELS = Object.freeze({
  [MODIFIER_TYPE.PLUS_2]: '+2',
  [MODIFIER_TYPE.PLUS_4]: '+4',
  [MODIFIER_TYPE.PLUS_6]: '+6',
  [MODIFIER_TYPE.PLUS_8]: '+8',
  [MODIFIER_TYPE.PLUS_10]: '+10',
  [MODIFIER_TYPE.TIMES_2]: '×2',
})

// Etiqueta legible de cada tipo de carta de acción.
// IMPORTANTE: estos son nombres propios del juego y NO se traducen.
export const ACTION_LABELS = Object.freeze({
  [CARD_TYPE.FREEZE]: 'Freeze',
  [CARD_TYPE.FLIP_THREE]: 'Flip Three',
  [CARD_TYPE.SECOND_CHANCE]: 'Second Chance',
})

// Etiqueta legible de los estatus del juego.
export const STATUS_LABELS = Object.freeze({
  [STATUS.WAITING]: 'Esperando para iniciar',
  [STATUS.IN_ROUND]: 'En curso',
  [STATUS.ROUND_END]: 'Ronda terminada',
  [STATUS.GAME_OVER]: 'Partida terminada',
})

// Etiqueta legible de los estatus de jugador.
export const PLAYER_STATUS_LABELS = Object.freeze({
  [PLAYER_STATUS.ACTIVE]: 'ACTIVO',
  [PLAYER_STATUS.STAYED]: 'PLANTADO',
  [PLAYER_STATUS.BUSTED]: 'ELIMINADO',
})
