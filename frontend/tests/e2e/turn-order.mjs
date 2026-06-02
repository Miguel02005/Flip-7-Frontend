// Regression test for turn-advance after bust/stay.
// Verifies: after current player busts/stays, turn goes to the next player
// in clockwise order, NOT back to the first active player.
import {
  createGame,
  startRound,
  drawCard,
  stay,
  applyAction,
  getGameState,
  _resetState,
} from '../../src/services/mock/mockApi.js'
import { PLAYER_STATUS } from '../../src/services/mock/mockData.js'

let pass = 0
let fail = 0
function check(name, cond, info) {
  if (cond) {
    pass++
    console.log(`✓ ${name}`)
  } else {
    fail++
    console.log(`✗ ${name}`, info || '')
  }
}

// Helper: drive the game forward, auto-resolving any pending action by
// targeting the source player (always a valid target per official rules).
async function pump(g, gameId, currentPlayerId, maxSteps = 30) {
  for (let i = 0; i < maxSteps; i++) {
    const gs = await getGameState({ gameId })
    if (gs.status !== 'IN_ROUND') return gs
    if (gs.pendingAction) {
      await applyAction({
        gameId,
        sourcePlayerId: gs.pendingAction.sourcePlayerId,
        targetId: gs.pendingAction.sourcePlayerId,
      })
      continue
    }
    if (gs.currentPlayerId !== currentPlayerId) return gs
    return gs
  }
  return getGameState({ gameId })
}

// Test 1: A stays → B's turn
{
  _resetState()
  const g = await createGame({ playerNames: ['A', 'B', 'C', 'D'] })
  const start = await startRound({ gameId: g.gameId })
  // Auto-resolve any pending action that came up in the initial deal
  if (start.pendingAction) {
    await applyAction({
      gameId: g.gameId,
      sourcePlayerId: start.pendingAction.sourcePlayerId,
      targetId: start.pendingAction.sourcePlayerId,
    })
  }
  let gs = await getGameState({ gameId: g.gameId })
  check('Initial current is A (dealer)', gs.currentPlayerId === 'player-1',
    `got ${gs.currentPlayerId}`)
  await stay({ gameId: g.gameId, playerId: 'player-1' })
  gs = await getGameState({ gameId: g.gameId })
  check('After A stays, current is B',
    gs.currentPlayerId === 'player-2',
    `got ${gs.currentPlayerId}`)
}

// Test 2: A stays, B stays, C busts → current is D (not A)
// This matches the spec's example: A→B→C plays, C draws duplicate and busts,
// next player must be D.
{
  let ran = false
  for (let attempt = 0; attempt < 200 && !ran; attempt++) {
    _resetState()
    const g = await createGame({ playerNames: ['A', 'B', 'C', 'D'] })
    const start = await startRound({ gameId: g.gameId })
    if (start.pendingAction) {
      await applyAction({
        gameId: g.gameId,
        sourcePlayerId: start.pendingAction.sourcePlayerId,
        targetId: start.pendingAction.sourcePlayerId,
      })
    }
    // A stays, B stays — we need C to be the one to bust
    for (const id of ['player-1', 'player-2']) {
      const gs = await getGameState({ gameId: g.gameId })
      if (gs.currentPlayerId !== id) break
      if (gs.pendingAction) {
        await applyAction({
          gameId: g.gameId,
          sourcePlayerId: gs.pendingAction.sourcePlayerId,
          targetId: gs.pendingAction.sourcePlayerId,
        })
      }
      await stay({ gameId: g.gameId, playerId: id })
    }
    // Now C draws until bust
    for (let i = 0; i < 30; i++) {
      const gs = await getGameState({ gameId: g.gameId })
      if (gs.status !== 'IN_ROUND') break
      if (gs.currentPlayerId !== 'player-3') break
      if (gs.pendingAction) {
        await applyAction({
          gameId: g.gameId,
          sourcePlayerId: gs.pendingAction.sourcePlayerId,
          targetId: gs.pendingAction.sourcePlayerId,
        })
        continue
      }
      const r = await drawCard({ gameId: g.gameId, playerId: 'player-3' })
      const p3 = r.players.find((p) => p.id === 'player-3')
      if (p3.status === PLAYER_STATUS.BUSTED) {
        ran = true
        check('After C busts, current is D (not A)',
          r.currentPlayerId === 'player-4',
          `got ${r.currentPlayerId}`)
        check('A is not the current player after C busts',
          r.currentPlayerId !== 'player-1',
          `got ${r.currentPlayerId}`)
        break
      }
      if (r.status !== 'IN_ROUND') break
    }
  }
  if (!ran) {
    console.log('(skipped: could not force C to bust in 200 attempts)')
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
