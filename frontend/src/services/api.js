// ─────────────────────────────────────────────────────────────────────────────
// Flip 7 — API facade
//
// This is the ONLY file the rest of the app imports to talk to the
// backend. It re-exports the functions from realApi.js with the same
// signature as before to keep compatibility with the existing code.
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
 * Historical alias: getHistory is kept for HistoryPage.
 * The backend exposes the history in GameResponse.roundHistory, so
 * getHistory is just a wrapper of getGameState that returns the relevant
 * slice (rounds + winner).
 */
export async function getHistory({ gameId }) {
  const state = await getGameState({ gameId })
  return {
    winner: state.winner,
    rounds: state.roundHistory || [],
  }
}

