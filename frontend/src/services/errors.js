// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — Mapping of backend errors to friendly messages in English
//
// The backend returns ApiErrorResponse { error: "BAD_REQUEST" | "CONFLICT",
// message: "..." }. This module translates the known `message` values to
// English and keeps the original HTTP `status` so the UI can decide what to do.
// ─────────────────────────────────────────────────────────────────────────────

import { API_TIMEOUT_MS } from '../config/api.js'

// Network / timeout / DNS errors
export const NETWORK_ERROR = 'NETWORK_ERROR'
export const TIMEOUT_ERROR = 'TIMEOUT_ERROR'

// Dictionary: raw backend message → English message
const TRANSLATIONS = {
  'Need at least 2 players':
    'At least 2 players are required to create a game.',
  'Game not found': 'The game does not exist or is no longer available.',
  'Not your turn':
    "It is not your turn. Wait for the current player to finish their play.",
  'No pending action': 'There is no pending action to resolve.',
  'Target player is not active':
    'The target player is not active this round.',
  'Unsupported action': 'Unsupported action type.',
  'Round already in progress': 'A round is already in progress.',
  'Game is already finished': 'The game has already finished.',
  'Game is not finished': 'The game has not finished yet.',
}

export function translateMessage(rawMessage) {
  if (!rawMessage) return 'Unknown error.'
  return TRANSLATIONS[rawMessage] || rawMessage
}

// Builds an enriched Error from a non-OK HTTP response.
// Returns an Error with fields: status, errorCode, message (in English).
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

// Builds an Error for network / timeout failures.
export function buildNetworkError(kind) {
  const msg =
    kind === TIMEOUT_ERROR
      ? 'The request took too long. Check your connection and try again.'
      : 'Could not connect to the server. Make sure the backend is running.'
  const err = new Error(msg)
  err.status = 0
  err.errorCode = kind
  return err
}

export { API_TIMEOUT_MS }
