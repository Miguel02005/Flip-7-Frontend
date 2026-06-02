// ─────────────────────────────────────────────────────────────────────────────
// FLIP 7  —  API Facade
//
// This is the ONLY file the rest of the app imports for backend calls.
// Controlled by VITE_USE_MOCK env variable.
//
// To switch to real backend:
//   1. Set VITE_USE_MOCK=false in .env.production
//   2. (Optional) Delete src/services/mock/ folder
//   3. Done — zero changes anywhere else in the codebase.
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

let _api = null

async function getApi() {
  if (_api) return _api
  if (USE_MOCK) {
    _api = await import('./mock/mockApi.js')
  } else {
    _api = await import('./realApi.js')
  }
  return _api
}

export async function createGame(params) {
  return (await getApi()).createGame(params)
}

export async function startRound(params) {
  return (await getApi()).startRound(params)
}

export async function drawCard(params) {
  return (await getApi()).drawCard(params)
}

export async function stay(params) {
  return (await getApi()).stay(params)
}

export async function applyAction(params) {
  return (await getApi()).applyAction(params)
}

export async function getGameState(params) {
  return (await getApi()).getGameState(params)
}

export async function getHistory(params) {
  return (await getApi()).getHistory(params)
}