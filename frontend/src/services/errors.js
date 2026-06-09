// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — Mapeo de errores del backend a mensajes amigables en español
//
// El backend devuelve ApiErrorResponse { error: "BAD_REQUEST" | "CONFLICT",
// message: "..." }. Este módulo traduce los `message` conocidos al español
// y mantiene el `status` HTTP original para que la UI pueda decidir qué hacer.
// ─────────────────────────────────────────────────────────────────────────────

import { API_TIMEOUT_MS } from '../config/api.js'

// Errores de red / timeout / DNS
export const NETWORK_ERROR = 'NETWORK_ERROR'
export const TIMEOUT_ERROR = 'TIMEOUT_ERROR'

// Diccionario: message crudo del backend → mensaje en español
const TRANSLATIONS = {
  'Need at least 2 players':
    'Se necesitan al menos 2 jugadores para crear la partida.',
  'Game not found': 'La partida no existe o ya no está disponible.',
  'Not your turn':
    'No es tu turno. Espera a que el jugador actual termine su jugada.',
  'No pending action': 'No hay ninguna acción pendiente que resolver.',
  'Target player is not active':
    'El jugador objetivo no está activo en esta ronda.',
  'Unsupported action': 'Tipo de acción no soportada.',
  'Round already in progress': 'Ya hay una ronda en curso.',
  'Game is already finished': 'La partida ya ha terminado.',
  'Game is not finished': 'La partida aún no ha terminado.',
}

export function translateMessage(rawMessage) {
  if (!rawMessage) return 'Error desconocido.'
  return TRANSLATIONS[rawMessage] || rawMessage
}

// Construye un Error enriquecido a partir de una respuesta HTTP no-OK.
// Devuelve un Error con campos: status, errorCode, message (en español).
export function buildHttpError(status, body) {
  const errorCode = body?.error || 'UNKNOWN'
  const rawMessage = body?.message || ''
  const friendly = translateMessage(rawMessage)

  const err = new Error(friendly)
  err.status = status
  err.errorCode = errorCode
  err.rawMessage = rawMessage
  return err
}

// Construye un Error para fallos de red / timeout.
export function buildNetworkError(kind) {
  const msg =
    kind === TIMEOUT_ERROR
      ? 'La petición tardó demasiado. Verifica tu conexión e inténtalo de nuevo.'
      : 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
  const err = new Error(msg)
  err.status = 0
  err.errorCode = kind
  return err
}

export { API_TIMEOUT_MS }
