// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — Cliente HTTP para el backend Spring Boot
//
// Todas las funciones devuelven el body de la respuesta parseado (JSON) o
// lanzan un Error enriquecido (status, errorCode, message) en caso de fallo.
// Sin mocks, sin stubs: cada llamada golpea el backend real.
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE, API_TIMEOUT_MS } from '../config/api.js'
import { buildHttpError, buildNetworkError, TIMEOUT_ERROR } from './errors.js'

// ─── Helper interno ──────────────────────────────────────────────────────────

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  // Si el caller ya pasó un signal (para cancelación externa), conectarlo.
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
      // El backend a veces puede devolver texto plano; lo ignoramos.
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
 * Crea una nueva partida con los jugadores indicados (mín. 2).
 * Devuelve { gameId }.
 */
export async function createGame({ playerNames }) {
  return request('/games', { method: 'POST', body: { playerNames } })
}

/**
 * GET /games/{gameId}
 * Devuelve el GameResponse completo (estado actual de la partida).
 */
export async function getGameState({ gameId }) {
  return request(`/games/${enc(gameId)}`)
}

/**
 * POST /games/{gameId}/rounds/start
 * Inicia una nueva ronda en la partida indicada.
 */
export async function startRound({ gameId }) {
  return request(`/games/${enc(gameId)}/rounds/start`, { method: 'POST' })
}

/**
 * POST /games/{gameId}/draw
 * El jugador actual roba una carta. Body: { playerId }.
 */
export async function drawCard({ gameId, playerId }) {
  return request(`/games/${enc(gameId)}/draw`, {
    method: 'POST',
    body: { playerId },
  })
}

/**
 * POST /games/{gameId}/stay
 * El jugador actual se planta. Body: { playerId }.
 */
export async function stay({ gameId, playerId }) {
  return request(`/games/${enc(gameId)}/stay`, {
    method: 'POST',
    body: { playerId },
  })
}

/**
 * POST /games/{gameId}/actions
 * Resuelve la acción pendiente (FREEZE / FLIP_THREE) eligiendo objetivo.
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
 * Devuelve la lista de partidas terminadas.
 */
export async function getFinishedGames() {
  return request('/games/finished')
}

/**
 * GET /games/finished/{gameId}
 * Devuelve el GameResponse de una partida ya terminada.
 */
export async function getFinishedGame({ gameId }) {
  return request(`/games/finished/${enc(gameId)}`)
}
