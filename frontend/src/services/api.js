// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — Fachada de la API
//
// Este es el ÚNICO archivo que el resto de la app importa para hablar con el
// backend. Re-exporta las funciones de realApi.js con la misma firma que antes
// para mantener compatibilidad con el código existente.
// ─────────────────────────────────────────────────────────────────────────────

import { getGameState } from './realApi.js'

export {
  createGame,
  startRound,
  drawCard,
  stay,
  applyAction,
  getGameState,
  getFinishedGames,
  getFinishedGame,
} from './realApi.js'

/**
 * Alias histórico: getHistory se mantiene para HistoryPage.
 * El backend expone el historial en GameResponse.roundHistory, así que
 * getHistory es solo un wrapper de getGameState que devuelve el slice
 * relevante (rondas + ganador).
 */
export async function getHistory({ gameId }) {
  const state = await getGameState({ gameId })
  return {
    winner: state.winner,
    rounds: state.roundHistory || [],
  }
}

