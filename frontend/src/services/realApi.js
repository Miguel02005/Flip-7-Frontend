// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — HTTP client for the Spring Boot backend
//
// All functions return the parsed response body (JSON) or throw an
// enriched Error (status, errorCode, message) on failure.
// No mocks, no stubs: every call hits the real backend.
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE, API_TIMEOUT_MS } from '../config/api.js'
import { buildHttpError, buildNetworkError, TIMEOUT_ERROR } from './errors.js'

// ─── Internal helper ─────────────────────────────────────────────────────────

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  // If the caller already passed a signal (for external cancellation), wire it up.
  if (signal) {
    if (signal.aborted) controller.abort()
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw buildNetworkError(TIMEOUT_ERROR)
    }
    throw buildNetworkError('NETWORK_ERROR')
  }
  clearTimeout(timeoutId)

  let parsed = null
  const text = await response.text()
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      // The backend may sometimes return plain text; we ignore it.
      parsed = null
    }
  }

  if (!response.ok) {
    throw buildHttpError(response.status, parsed)
  }
  return parsed
}

const enc = (id) => encodeURIComponent(id)

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /games
 * Creates a new game with the given players (min. 2).
 * Returns { gameId }.
 */
export async function createGame({ playerNames }) {
  return request('/games', { method: 'POST', body: { playerNames } })
}

/**
 * GET /games/{gameId}
 * Returns the full GameResponse (current state of the game).
 */
export async function getGameState({ gameId }) {
  return request(`/games/${enc(gameId)}`)
}

/**
 * POST /games/{gameId}/rounds/start
 * Starts a new round in the given game.
 */
export async function startRound({ gameId }) {
  return request(`/games/${enc(gameId)}/rounds/start`, { method: 'POST' })
}

/**
 * POST /games/{gameId}/draw
 * The current player draws a card. Body: { playerId }.
 */
export async function drawCard({ gameId, playerId }) {
  return request(`/games/${enc(gameId)}/draw`, {
    method: 'POST',
    body: { playerId },
  })
}

/**
 * POST /games/{gameId}/stay
 * The current player stays. Body: { playerId }.
 */
export async function stay({ gameId, playerId }) {
  return request(`/games/${enc(gameId)}/stay`, {
    method: 'POST',
    body: { playerId },
  })
}

/**
 * POST /games/{gameId}/actions
 * Resolves the pending action (FREEZE / FLIP_THREE) by choosing a target.
 * Body: { targetPlayerId }.
 */
export async function applyAction({ gameId, targetPlayerId }) {
  return request(`/games/${enc(gameId)}/actions`, {
    method: 'POST',
    body: { targetPlayerId },
  })
}

/**
 * GET /games/finished
 * Returns the list of finished games.
 */
export async function getFinishedGames() {
  return request('/games/finished')
}

/**
 * GET /games/finished/{gameId}
 * Returns the GameResponse of an already-finished game.
 */
export async function getFinishedGame({ gameId }) {
  return request(`/games/finished/${enc(gameId)}`)
}
