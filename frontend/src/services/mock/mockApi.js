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

function activePlayerIds() {
  return _state.players
    .filter((p) => p.status === PLAYER_STATUS.ACTIVE)
    .map((p) => p.id)
}

function getPlayer(playerId) {
  return _state.players.find((p) => p.id === playerId)
}

function drawFromDeck() {
  if (_state.deck.length === 0) {
    // Reshuffle discard pile (leave in-play cards untouched)
    _state.deck = shuffleDeck(_state.discardPile)
    _state.discardPile = []
  }
  return _state.deck.shift()
}

function calculateScore(player) {
  const numberCards = player.hand.filter((c) => c.type === CARD_TYPES.NUMBER)
  const modifiers = player.hand.filter((c) => c.type === CARD_TYPES.MODIFIER)

  let score = numberCards.reduce((sum, c) => sum + c.value, 0)

  // Apply x2 first (if any), then additions
  const hasDouble = modifiers.some((m) => m.modifier === MODIFIER_VALUES.TIMES_2)
  if (hasDouble) score *= 2

  for (const mod of modifiers) {
    if (mod.modifier !== MODIFIER_VALUES.TIMES_2) {
      score += parseInt(mod.modifier.replace('+', ''))
    }
  }

  const uniqueNumbers = new Set(numberCards.map((c) => c.value))
  if (uniqueNumbers.size === 7) score += FLIP7_BONUS

  return score
}

function checkRoundEnd() {
  const actives = activePlayerIds()
  if (actives.length === 0) return true

  const flip7Winner = _state.players.find((p) => {
    if (p.status !== PLAYER_STATUS.ACTIVE) return false
    const uniqueNums = new Set(
      p.hand.filter((c) => c.type === CARD_TYPES.NUMBER).map((c) => c.value)
    )
    return uniqueNums.size >= 7
  })

  if (flip7Winner) {
    flip7Winner.status = PLAYER_STATUS.STAYED
    flip7Winner.flippedSeven = true
    // Force all others to end
    _state.players.forEach((p) => {
      if (p.status === PLAYER_STATUS.ACTIVE) p.status = PLAYER_STATUS.STAYED
    })
    return true
  }

  return false
}

function advanceTurn() {
  const actives = _state.players
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.status === PLAYER_STATUS.ACTIVE)

  if (actives.length === 0) return

  const currentIdx = actives.findIndex((p) => p.id === _state.currentPlayerId)
  const nextIdx = (currentIdx + 1) % actives.length
  _state.currentPlayerId = actives[nextIdx].id
}

function finalizeRound() {
  _state.players.forEach((p) => {
    if (p.status === PLAYER_STATUS.BUSTED) {
      p.roundScore = 0
    } else {
      p.roundScore = calculateScore(p)
      p.totalScore += p.roundScore
    }
  })

  // Persist round result
  _state.roundHistory.push({
    round: _state.currentRound,
    scores: _state.players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      score: p.roundScore,
      busted: p.status === PLAYER_STATUS.BUSTED,
    })),
  })

  // Check game winner
  const winners = _state.players.filter((p) => p.totalScore >= WIN_THRESHOLD)
  if (winners.length > 0) {
    _state.status = GAME_STATUS.GAME_OVER
    _state.winner = winners.reduce((a, b) =>
      a.totalScore >= b.totalScore ? a : b
    )
  } else {
    _state.status = GAME_STATUS.ROUND_END
  }
}

function startNewRound() {
  _state.currentRound++

  // Move used cards to discard (deck persists between rounds unless empty)
  _state.players.forEach((p) => {
    _state.discardPile.push(...p.hand)
    p.hand = []
    p.status = PLAYER_STATUS.ACTIVE
    p.secondChance = false
    p.flippedSeven = false
    p.roundScore = 0
  })

  // Rotate dealer/first player to the left
  const firstIdx =
    (_state.players.findIndex((p) => p.id === _state.firstPlayerId) + 1) %
    _state.players.length
  _state.firstPlayerId = _state.players[firstIdx].id
  _state.currentPlayerId = _state.firstPlayerId
  _state.status = GAME_STATUS.IN_ROUND

  // Deal one card to each player
  const events = []
  for (const player of _state.players) {
    const card = drawFromDeck()
    const result = resolveCard(player, card)
    events.push(...result.events)
  }

  return { round: _state.currentRound, events }
}

// Resolves a card being added to a player's hand. Returns events array.
function resolveCard(player, card) {
  const events = []

  if (card.type === CARD_TYPES.NUMBER) {
    const duplicate = player.hand.find(
      (c) => c.type === CARD_TYPES.NUMBER && c.value === card.value
    )

    if (duplicate && player.secondChance) {
      // Second chance absorbs the bust
      player.secondChance = false
      player.hand = player.hand.filter((c) => c.id !== duplicate.id)
      // Remove second chance card from hand too
      player.hand = player.hand.filter((c) => c.type !== CARD_TYPES.SECOND_CHANCE)
      events.push({ type: 'SECOND_CHANCE_USED', playerId: player.id, card })
    } else if (duplicate) {
      player.status = PLAYER_STATUS.BUSTED
      player.hand.push(card)
      events.push({ type: 'BUST', playerId: player.id, card })
    } else {
      player.hand.push(card)
      events.push({ type: 'CARD_DEALT', playerId: player.id, card })
    }
  } else if (card.type === CARD_TYPES.MODIFIER) {
    player.hand.push(card)
    events.push({ type: 'MODIFIER_DEALT', playerId: player.id, card })
  } else if (card.type === CARD_TYPES.FREEZE) {
    player.status = PLAYER_STATUS.STAYED
    player.hand.push(card)
    events.push({ type: 'FREEZE', playerId: player.id, card })
  } else if (card.type === CARD_TYPES.FLIP_THREE) {
    player.hand.push(card)
    events.push({ type: 'FLIP_THREE_START', playerId: player.id, card })
    // Draw 3 additional cards (stop on bust or flip7)
    for (let i = 0; i < 3; i++) {
      if (
        player.status === PLAYER_STATUS.BUSTED ||
        player.status === PLAYER_STATUS.STAYED
      )
        break
      const extra = drawFromDeck()
      const subResult = resolveCard(player, extra)
      events.push(...subResult.events)
    }
    events.push({ type: 'FLIP_THREE_END', playerId: player.id })
  } else if (card.type === CARD_TYPES.SECOND_CHANCE) {
    if (!player.secondChance) {
      player.secondChance = true
      player.hand.push(card)
      events.push({ type: 'SECOND_CHANCE_RECEIVED', playerId: player.id, card })
    } else {
      // Already has one — give to another active player or discard
      const other = _state.players.find(
        (p) =>
          p.id !== player.id &&
          p.status === PLAYER_STATUS.ACTIVE &&
          !p.secondChance
      )
      if (other) {
        other.secondChance = true
        other.hand.push(card)
        events.push({ type: 'SECOND_CHANCE_REDIRECTED', playerId: other.id, card })
      } else {
        _state.discardPile.push(card)
        events.push({ type: 'SECOND_CHANCE_DISCARDED', card })
      }
    }
  }

  return { events }
}

// ─── Public API (mirrors backend REST shape) ──────────────────────────────────

export async function createGame({ playerNames }) {
  await delay()
  _cardIdCounter = 1
  const deck = shuffleDeck(buildFullDeck())

  _state = {
    id: `game-${Date.now()}`,
    status: GAME_STATUS.WAITING,
    currentRound: 0,
    players: playerNames.map((name, i) => ({
      id: `player-${i + 1}`,
      name,
      totalScore: 0,
      roundScore: 0,
      hand: [],
      status: PLAYER_STATUS.ACTIVE,
      secondChance: false,
      flippedSeven: false,
    })),
    deck,
    discardPile: [],
    currentPlayerId: null,
    firstPlayerId: null,
    winner: null,
    roundHistory: [],
  }

  _state.firstPlayerId = _state.players[0].id
  _state.currentPlayerId = _state.firstPlayerId

  return { gameId: _state.id, players: _state.players }
}

export async function startRound({ gameId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')

  const result = startNewRound()

  if (checkRoundEnd()) {
    finalizeRound()
  }

  return serializeState(result.events)
}

export async function drawCard({ gameId, playerId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  if (_state.currentPlayerId !== playerId) throw new Error('Not your turn')

  const player = getPlayer(playerId)
  if (!player || player.status !== PLAYER_STATUS.ACTIVE)
    throw new Error('Player is not active')

  const card = drawFromDeck()
  const { events } = resolveCard(player, card)

  const roundOver = checkRoundEnd()
  if (roundOver) finalizeRound()
  else advanceTurn()

  return serializeState(events)
}

export async function stay({ gameId, playerId }) {
  await delay()
  if (!_state || _state.id !== gameId) throw new Error('Game not found')
  if (_state.currentPlayerId !== playerId) throw new Error('Not your turn')

  const player = getPlayer(playerId)
  if (!player || player.status !== PLAYER_STATUS.ACTIVE)
    throw new Error('Player is not active')

  player.status = PLAYER_STATUS.STAYED
  const events = [{ type: 'PLAYER_STAYED', playerId }]

  const roundOver = checkRoundEnd()
  if (roundOver) finalizeRound()
  else advanceTurn()

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
    winner: _state.winner
      ? { id: _state.winner.id, name: _state.winner.name, totalScore: _state.winner.totalScore }
      : null,
  }
}

// Serialize state into the shape the frontend expects (mirrors backend DTO)
function serializeState(events = []) {
  return {
    gameId: _state.id,
    status: _state.status,
    currentRound: _state.currentRound,
    currentPlayerId: _state.currentPlayerId,
    winner: _state.winner
      ? { id: _state.winner.id, name: _state.winner.name, totalScore: _state.winner.totalScore }
      : null,
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
    events,
  }
}

// For Playwright tests only: expose internal state reset
export function _resetState() {
  _state = null
}

let _cardIdCounter = 1