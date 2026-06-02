// ─────────────────────────────────────────────────────────────────────────────
// FLIP 7  —  Mock API
//
// Simulates the Java backend REST responses.
// ALL game logic lives here (mirrors backend rules).
// To connect real backend: delete this file + mock/ folder,
// flip VITE_USE_MOCK=false, done.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildFullDeck,
  shuffleDeck,
  CARD_TYPES,
  MODIFIER_VALUES,
  PLAYER_STATUS,
  GAME_STATUS,
  FLIP7_BONUS,
  WIN_THRESHOLD,
} from './mockData.js'

// In-memory store (resets on page reload — same as a fresh server)
let _state = null

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlayer(playerId) {
  return _state.players.find((p) => p.id === playerId)
}

function activePlayers() {
  return _state.players.filter((p) => p.status === PLAYER_STATUS.ACTIVE)
}

function playerHasUniqueNumberSet(player) {
  const numbers = player.hand
    .filter((c) => c.type === CARD_TYPES.NUMBER)
    .map((c) => c.value)
  return new Set(numbers).size
}

function drawFromDeck() {
  if (_state.deck.length === 0) {
    // Reshuffle discard pile into a new deck. Cards in front of players stay.
    _state.deck = shuffleDeck(_state.discardPile)
    _state.discardPile = []
  }
  return _state.deck.shift()
}

function cardBonusValue(mod) {
  // +2 → 2, +10 → 10
  return parseInt(String(mod).replace('+', ''), 10)
}

function calculateScore(player) {
  const numberCards = player.hand.filter((c) => c.type === CARD_TYPES.NUMBER)
  const modifiers = player.hand.filter((c) => c.type === CARD_TYPES.MODIFIER)

  // 1. Sum number values
  let score = numberCards.reduce((sum, c) => sum + c.value, 0)

  // 2. Apply x2 to that sum
  const hasDouble = modifiers.some((m) => m.modifier === MODIFIER_VALUES.TIMES_2)
  if (hasDouble) score *= 2

  // 3. Add flat bonuses
  for (const m of modifiers) {
    if (m.modifier !== MODIFIER_VALUES.TIMES_2) {
      score += cardBonusValue(m.modifier)
    }
  }

  // 4. Flip 7 bonus
  if (playerHasUniqueNumberSet(player) >= 7) {
    score += FLIP7_BONUS
  }

  return score
}

function advanceTurn() {
  // Turn order follows the FULL _state.players array (clockwise from the
  // dealer, set in startNewRound). We must NOT filter to activePlayers first
  // — doing so would shift indices and cause the turn to wrap back to the
  // first active player after every bust/stay, instead of the next player in
  // the original clockwise order.
  const all = _state.players
  if (all.length === 0) return
  const currentIdx = all.findIndex((p) => p.id === _state.currentPlayerId)
  const startFrom = currentIdx === -1 ? 0 : currentIdx
  for (let step = 1; step <= all.length; step++) {
    const idx = (startFrom + step) % all.length
    if (all[idx].status === PLAYER_STATUS.ACTIVE) {
      _state.currentPlayerId = all[idx].id
      return
    }
  }
  // No active players found — round should have ended. Leave currentPlayerId
  // as-is; the caller (maybeEndRound) is responsible for finalizing.
}

// Check if a player achieved Flip 7 and end the round for everyone
function checkFlip7() {
  const flip7Player = _state.players.find(
    (p) =>
      p.status === PLAYER_STATUS.ACTIVE &&
      playerHasUniqueNumberSet(p) >= 7
  )
  if (!flip7Player) return null
  flip7Player.flippedSeven = true
  // End the round for everyone: active → stayed (busted stays busted)
  for (const p of _state.players) {
    if (p.status === PLAYER_STATUS.ACTIVE) {
      p.status = PLAYER_STATUS.STAYED
    }
  }
  return flip7Player
}

// Called after every state change that might end the round.
// Returns true if round ended.
function maybeEndRound() {
  if (activePlayers().length === 0) {
    finalizeRound()
    return true
  }
  const flip7Player = checkFlip7()
  if (flip7Player) {
    finalizeRound()
    return true
  }
  return false
}

function finalizeRound() {
  for (const p of _state.players) {
    if (p.status === PLAYER_STATUS.BUSTED) {
      p.roundScore = 0
    } else {
      p.roundScore = calculateScore(p)
      p.totalScore += p.roundScore
    }
  }

  _state.roundHistory.push({
    round: _state.currentRound,
    dealerId: _state.dealerId,
    scores: _state.players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      score: p.roundScore,
      busted: p.status === PLAYER_STATUS.BUSTED,
      flippedSeven: p.flippedSeven,
    })),
  })

  // Check game end (200+ reached this round, or already at 200+)
  const reached = _state.players.filter((p) => p.totalScore >= WIN_THRESHOLD)
  if (reached.length > 0) {
    _state.status = GAME_STATUS.GAME_OVER
    // Highest total wins; tie goes to the tied player with most points
    const winner = reached.reduce((a, b) =>
      a.totalScore >= b.totalScore ? a : b
    )
    _state.winner = {
      id: winner.id,
      name: winner.name,
      totalScore: winner.totalScore,
    }
  } else {
    _state.status = GAME_STATUS.ROUND_END
  }
}

// ─── Card resolution ─────────────────────────────────────────────────────────

// Resolve a non-targeted card drawn into a player's hand during the Hit phase.
// Returns { events, pendingAction }. pendingAction is set when an action card
// (Freeze / Flip Three) requires a target choice from the UI.
function resolveDrawnCard(player, card) {
  const events = []
  let pendingAction = null

  if (card.type === CARD_TYPES.NUMBER) {
    const hasDup = player.hand.some(
      (c) => c.type === CARD_TYPES.NUMBER && c.value === card.value
    )

    if (hasDup && player.secondChance) {
      // Second Chance absorbs the bust
      player.secondChance = false
      // Remove the Second Chance card from hand
      player.hand = player.hand.filter(
        (c) => c.type !== CARD_TYPES.SECOND_CHANCE
      )
      // The duplicate number that caused the bust is discarded
      _state.discardPile.push(card)
      events.push({ type: 'SECOND_CHANCE_USED', playerId: player.id, card })
    } else if (hasDup) {
      // Bust
      player.hand.push(card)
      player.status = PLAYER_STATUS.BUSTED
      events.push({ type: 'BUST', playerId: player.id, card })
    } else {
      player.hand.push(card)
      events.push({ type: 'CARD_DEALT', playerId: player.id, card })
    }
  } else if (card.type === CARD_TYPES.MODIFIER) {
    // Modifiers never bust
    player.hand.push(card)
    events.push({ type: 'MODIFIER_DEALT', playerId: player.id, card })
  } else if (card.type === CARD_TYPES.SECOND_CHANCE) {
    handleSecondChanceDealt(player, card, events)
  } else if (card.type === CARD_TYPES.FREEZE) {
    // Action card: place it in hand but require target choice
    player.hand.push(card)
    pendingAction = { card, sourcePlayerId: player.id, type: CARD_TYPES.FREEZE }
    events.push({ type: 'ACTION_DRAWN', playerId: player.id, card })
  } else if (card.type === CARD_TYPES.FLIP_THREE) {
    // Action card: place it in hand but require target choice
    player.hand.push(card)
    pendingAction = {
      card,
      sourcePlayerId: player.id,
      type: CARD_TYPES.FLIP_THREE,
    }
    events.push({ type: 'ACTION_DRAWN', playerId: player.id, card })
  }

  return { events, pendingAction }
}

function handleSecondChanceDealt(player, card, events) {
  if (!player.secondChance) {
    player.secondChance = true
    player.hand.push(card)
    events.push({ type: 'SECOND_CHANCE_RECEIVED', playerId: player.id, card })
    return
  }
  // Player already has a Second Chance — must pass to another active player
  // who doesn't already have one. If none exists, discard.
  const candidate = _state.players.find(
    (p) =>
      p.id !== player.id &&
      p.status === PLAYER_STATUS.ACTIVE &&
      !p.secondChance
  )
  if (candidate) {
    candidate.secondChance = true
    candidate.hand.push(card)
    events.push({
      type: 'SECOND_CHANCE_REDIRECTED',
      playerId: candidate.id,
      card,
    })
  } else {
    _state.discardPile.push(card)
    events.push({ type: 'SECOND_CHANCE_DISCARDED', card })
  }
}

// Apply a pending action (Freeze or Flip Three) to a target. Updates state
// and resolves any chained draws.
function applyPendingAction(action, targetId) {
  const events = []
  const target = getPlayer(targetId)
  if (!target) throw new Error('Target not found')
  if (target.status !== PLAYER_STATUS.ACTIVE) {
    throw new Error('Target is not active')
  }

  if (action.type === CARD_TYPES.FREEZE) {
    // Forced stay: bank points & exit round
    target.status = PLAYER_STATUS.STAYED
    events.push({ type: 'FREEZE', playerId: target.id })
  } else if (action.type === CARD_TYPES.FLIP_THREE) {
    events.push({ type: 'FLIP_THREE_START', playerId: target.id })
    // Draw 3 cards, one at a time. Stop on bust or Flip 7.
    for (let i = 0; i < 3; i++) {
      if (target.status !== PLAYER_STATUS.ACTIVE) break
      if (playerHasUniqueNumberSet(target) >= 7) break
      const card = drawFromDeck()
      const { events: subEvents, pendingAction: nested } = resolveDrawnCard(
        target,
        card
      )
      events.push(...subEvents)
      // If a nested action appears among the 3, defer it (per official rules):
      // it resolves AFTER all 3 cards are drawn, only if the target hasn't busted.
      // We'll attach the nested action to the events stream as pending info;
      // since the spec says these are resolved after all 3 draws, we just keep
      // drawing and queue nested actions.
      if (nested) {
        // Defer; we apply it after the loop ends below
        action.__deferred = action.__deferred || []
        action.__deferred.push(nested)
      }
    }
    events.push({ type: 'FLIP_THREE_END', playerId: target.id })
    // Resolve any deferred actions queued during the 3 draws
    if (action.__deferred && target.status === PLAYER_STATUS.ACTIVE) {
      for (const d of action.__deferred) {
        // Default the deferred target to the same player if they are the only
        // active player. Otherwise, this is an edge case the UI must handle
        // via subsequent applyAction calls — we mark it pending.
        if (activePlayers().length === 1) {
          const { events: ev, pendingAction: pa } = applyPendingAction(
            d,
            target.id
          )
          events.push(...ev)
          if (pa) {
            _state.pendingAction = pa
          }
        } else {
          // Defer further — set as new pending action
          _state.pendingAction = d
          events.push({
            type: 'ACTION_DRAWN',
            playerId: target.id,
            card: d.card,
          })
        }
      }
    }
  }

  return { events, pendingAction: _state.pendingAction || null }
}

// Continue the initial deal to players who haven't received a card yet.
// Called after an action card drawn during the initial deal has been resolved.
function resumeInitialDeal() {
  if (
    typeof _state.__dealPausedAt !== 'number' ||
    _state.__dealPausedAt >= _state.players.length
  ) {
    _state.__dealPausedAt = undefined
    return []
  }

  const events = []
  const dealerIdx = _state.players.findIndex((p) => p.id === _state.dealerId)
  for (let i = _state.__dealPausedAt; i < _state.players.length; i++) {
    const player = _state.players[(dealerIdx + i) % _state.players.length]
    const card = drawFromDeck()
    const { events: subEvents, pendingAction } = resolveDrawnCard(
      player,
      card
    )
    events.push(...subEvents)
    if (pendingAction) {
      _state.pendingAction = pendingAction
      _state.__dealPausedAt = i + 1
      return events
    }
  }
  _state.__dealPausedAt = _state.players.length
  return events
}

// ─── Round lifecycle ──────────────────────────────────────────────────────────

function startNewRound() {
  // isFirstRound is computed BEFORE incrementing currentRound.
  const isFirstRound = _state.currentRound === 0
  _state.currentRound += 1

  // Move played cards to discard, reset players
  for (const p of _state.players) {
    _state.discardPile.push(...p.hand)
    p.hand = []
    p.status = PLAYER_STATUS.ACTIVE
    p.secondChance = false
    p.flippedSeven = false
    p.roundScore = 0
  }

  // Rotate dealer left (one position) starting from round 2.
  // Round 1's dealer is the first player (set at createGame).
  if (isFirstRound) {
    _state.dealerId = _state.players[0].id
  } else {
    const dealerIdx = _state.players.findIndex((p) => p.id === _state.dealerId)
    const nextDealerIdx = (dealerIdx + 1) % _state.players.length
    _state.dealerId = _state.players[nextDealerIdx].id
  }
  const dealerIdxNow = _state.players.findIndex((p) => p.id === _state.dealerId)
  _state.currentPlayerId = _state.dealerId
  _state.status = GAME_STATUS.IN_ROUND
  _state.pendingAction = null

  // Initial deal: one face-up card per player in turn order starting at dealer.
  // If an action card comes up, pause and resolve it before continuing to deal.
  const events = []
  for (let i = 0; i < _state.players.length; i++) {
    const player = _state.players[(dealerIdxNow + i) % _state.players.length]
    const card = drawFromDeck()
    const { events: subEvents, pendingAction } = resolveDrawnCard(
      player,
      card
    )
    events.push(...subEvents)

    if (pendingAction) {
      // Pause the deal — the action card needs a target before we continue.
      // Store it in state and let the UI prompt for a target. Subsequent
      // players get their initial deal card on the next applyAction round
      // (handled in the public startRound wrapper below).
      _state.pendingAction = pendingAction
      _state.__dealPausedAt = i + 1
      break
    }
  }
  if (!_state.pendingAction) {
    _state.__dealPausedAt = _state.players.length
  }

  return { events }
}

// ─── Public API (mirrors backend REST shape) ─────────────────────────────────

export async function createGame({ playerNames }) {
  await delay()
  if (!playerNames || playerNames.length < 2) {
    throw new Error('Need at least 2 players')
  }
  _cardIdCounter = 1
  const deck = shuffleDeck(buildFullDeck())

  const players = playerNames.map((name, i) => ({
    id: `player-${i + 1}`,
    name,
    totalScore: 0,
    roundScore: 0,
    hand: [],
    status: PLAYER_STATUS.ACTIVE,
    secondChance: false,
    flippedSeven: false,
  }))

  _state = {
    id: `game-${Date.now()}`,
    status: GAME_STATUS.WAITING,
    currentRound: 0,
    players,
    deck,
    discardPile: [],
    currentPlayerId: null,
    dealerId: players[0].id,
    winner: null,
    roundHistory: [],
    pendingAction: null,
  }

  return { gameId: _state.id, players: _state.players }
}

export async function startRound({ gameId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')

  const { events } = startNewRound()

  // If a pending action from initial deal is still open and the only active
  // player is the source, auto-apply to self to keep things moving.
  if (_state.pendingAction) {
    if (activePlayers().length === 1) {
      const targetId = _state.pendingAction.sourcePlayerId
      const { events: actionEvents } = applyPendingAction(
        _state.pendingAction,
        targetId
      )
      events.push(...actionEvents)
      _state.pendingAction = null
    }
  }

  // If the round ends during the initial deal (everyone busted, or flip 7),
  // handle it.
  maybeEndRound()

  return serializeState(events)
}

export async function drawCard({ gameId, playerId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  if (_state.currentPlayerId !== playerId) throw new Error('Not your turn')
  if (_state.pendingAction) {
    throw new Error('Resolve the pending action first')
  }
  if (_state.status !== GAME_STATUS.IN_ROUND) {
    throw new Error('Round is not in progress')
  }

  const player = getPlayer(playerId)
  if (!player || player.status !== PLAYER_STATUS.ACTIVE) {
    throw new Error('Player is not active')
  }

  const card = drawFromDeck()
  const { events, pendingAction } = resolveDrawnCard(player, card)

  if (pendingAction) {
    // If only one active player remains, they must target themselves
    if (activePlayers().length === 1) {
      const { events: actionEvents } = applyPendingAction(
        pendingAction,
        player.id
      )
      events.push(...actionEvents)
      _state.pendingAction = null
    } else {
      _state.pendingAction = pendingAction
    }
  }

  // If the round ended as a result, finalize; otherwise advance turn
  if (maybeEndRound()) {
    return serializeState(events)
  }
  advanceTurn()
  return serializeState(events)
}

export async function stay({ gameId, playerId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  if (_state.currentPlayerId !== playerId) throw new Error('Not your turn')
  if (_state.pendingAction) {
    throw new Error('Resolve the pending action first')
  }
  if (_state.status !== GAME_STATUS.IN_ROUND) {
    throw new Error('Round is not in progress')
  }

  const player = getPlayer(playerId)
  if (!player || player.status !== PLAYER_STATUS.ACTIVE) {
    throw new Error('Player is not active')
  }

  player.status = PLAYER_STATUS.STAYED
  const events = [{ type: 'PLAYER_STAYED', playerId }]

  if (maybeEndRound()) {
    return serializeState(events)
  }
  advanceTurn()
  return serializeState(events)
}

export async function applyAction({ gameId, sourcePlayerId, targetId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  const pending = _state.pendingAction
  if (!pending) throw new Error('No pending action')
  if (pending.sourcePlayerId !== sourcePlayerId) {
    throw new Error('Source player does not match pending action')
  }
  if (_state.status !== GAME_STATUS.IN_ROUND) {
    throw new Error('Round is not in progress')
  }

  // The source player drew the action card on their turn. If the source player
  // is no longer the current player (e.g., they were frozen or busted by a
  // nested effect), we still allow the action to resolve on the chosen target.
  // Source player can target any active player including themselves.

  const { events } = applyPendingAction(pending, targetId)
  _state.pendingAction = null

  // If we were in the middle of the initial deal, continue dealing the
  // remaining players now that the action has resolved.
  if (typeof _state.__dealPausedAt === 'number') {
    const dealEvents = resumeInitialDeal()
    events.push(...dealEvents)
  }

  if (maybeEndRound()) {
    return serializeState(events)
  }
  // After the action resolves, the turn outcome depends on the action type
  // and whether the source player targeted themselves or another player:
  //   - Flip Three used on ANOTHER player: the source has already taken their
  //     turn action. Turn advances to the next player immediately.
  //   - Flip Three used on SELF, or any other action (Freeze on self):
  //     the turn returns to the source player if they are still active,
  //     otherwise advance.
  const isFlipThreeOnOther =
    pending.type === CARD_TYPES.FLIP_THREE && targetId !== sourcePlayerId

  if (isFlipThreeOnOther) {
    advanceTurn()
  } else {
    const source = getPlayer(sourcePlayerId)
    if (source && source.status === PLAYER_STATUS.ACTIVE) {
      _state.currentPlayerId = source.id
    } else {
      advanceTurn()
    }
  }
  return serializeState(events)
}

export async function getGameState({ gameId }) {
  await delay(60)
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  return serializeState([])
}

export async function getHistory({ gameId }) {
  await delay(60)
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  return {
    gameId: _state.id,
    rounds: _state.roundHistory,
    winner: _state.winner,
  }
}

// Serialize state into the shape the frontend expects (mirrors backend DTO)
function serializeState(events = []) {
  return {
    gameId: _state.id,
    status: _state.status,
    currentRound: _state.currentRound,
    currentPlayerId: _state.currentPlayerId,
    dealerId: _state.dealerId,
    winner: _state.winner,
    players: _state.players.map((p) => ({
      id: p.id,
      name: p.name,
      totalScore: p.totalScore,
      roundScore: p.roundScore,
      hand: p.hand,
      status: p.status,
      secondChance: p.secondChance,
      flippedSeven: p.flippedSeven,
    })),
    deckRemaining: _state.deck.length,
    pendingAction: _state.pendingAction
      ? {
          type: _state.pendingAction.type,
          card: _state.pendingAction.card,
          sourcePlayerId: _state.pendingAction.sourcePlayerId,
        }
      : null,
    roundHistory: _state.roundHistory,
    events,
  }
}

// For Playwright tests only: expose internal state reset
export function _resetState() {
  _state = null
}

let _cardIdCounter = 1
