// ─────────────────────────────────────────────────────────────────────────────
// Flip 7  —  Game Store (Context + useReducer)
//
// Single source of truth for all UI state.
// Components read with useGame() and dispatch actions with useGameActions().
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable react-refresh/only-export-components */
// This module exports a Provider and its associated hooks. It is the
// recommended pattern for Context API in React: keeping them together
// eases fast refresh and module cohesion.

import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react'
import * as api from '../services/api.js'

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // Game metadata
  gameId: null,
  status: 'IDLE',           // IDLE | WAITING | IN_ROUND | ROUND_END | GAME_OVER
  currentRound: 0,
  currentPlayerId: null,
  dealerId: null,
  winner: null,

  // Players
  players: [],

  // Pending action that requires a target selection
  pendingAction: null,

  // UI
  loading: false,
  error: null,
  events: [],               // latest events from the backend (for animations)

  // Toast queue
  toasts: [],
  roundHistory: [],
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'GAME_CREATED': {
      const { gameId, players } = action.payload
      return {
        ...state,
        gameId,
        players: players || [],
        status: 'WAITING',
        currentRound: 0,
        loading: false,
        error: null,
        pendingAction: null,
        events: [],
        roundHistory: [],
      }
    }

    case 'STATE_UPDATED': {
      const {
        id: gameId,
        status,
        currentRound,
        currentPlayerId,
        dealerId,
        winner,
        players,
        roundHistory,
        pendingAction,
        lastAutomaticEvent,
      } = action.payload

 console.log('========== STATE UPDATED ==========')

console.log('PENDING ACTION:')
console.log(pendingAction)

console.table(
  (players || []).map((p) => ({
    name: p.name,
    id: p.id,
    status: p.status,
    roundScore: p.roundScore,
    totalScore: p.totalScore,
    cards: p.cards?.map(
      (c) =>
        c.value ??
        c.type ??
        c.modifier
    ).join(', '),
  }))
)

      // The backend includes lastAutomaticEvent (non-persistent) when an
      // automatic event occurred in the most recent mutation. We extract it
      // to show as a toast and discard it from the state.
      let events = state.events
      if (lastAutomaticEvent) {
        events = [lastAutomaticEvent, ...state.events].slice(0, 20)
      }

      return {
        ...state,
        gameId,
        status,
        currentRound: currentRound ?? state.currentRound,
        currentPlayerId,
        dealerId,
        winner,
        players,
        events,
        pendingAction: pendingAction || null,
        loading: false,
        error: null,
        roundHistory: roundHistory || state.roundHistory,
      }
    }

    case 'SET_ROUND_HISTORY':
      return { ...state, roundHistory: action.payload }

    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { id: Date.now() + Math.random(), ...action.payload },
        ],
      }

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      }

    case 'RESET':
      return { ...INITIAL_STATE }

    default:
      return state
  }
}

// ─── Contextos ───────────────────────────────────────────────────────────────

const GameStateContext = createContext(null)
const GameDispatchContext = createContext(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useGame() {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGame must be used within <GameProvider>')
  return ctx
}

function useDispatch() {
  const ctx = useContext(GameDispatchContext)
  if (!ctx) throw new Error('useGameActions must be used within <GameProvider>')
  return ctx
}

// ─── Action creators ─────────────────────────────────────────────────────────

export function useGameActions() {
  const dispatch = useDispatch()
  const state = useGame()

  // Keep a ref to the most recent state so async actions don't read
  // stale values (e.g. right after createGame before React has re-rendered).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const addToast = useCallback(
    (message, variant = 'info') => {
      dispatch({ type: 'ADD_TOAST', payload: { message, variant } })
    },
    [dispatch]
  )

  const removeToast = useCallback(
    (id) => dispatch({ type: 'REMOVE_TOAST', payload: id }),
    [dispatch]
  )

  const createGame = useCallback(
    async (playerNames) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        // 1) The backend only returns { gameId } on creation.
        const { gameId } = await api.createGame({ playerNames })
        // 2) We request the full state to get the players.
        const stateRes = await api.getGameState({ gameId })
        dispatch({
          type: 'GAME_CREATED',
          payload: { gameId, players: stateRes.players },
        })
        return { gameId, players: stateRes.players }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message })
        return null
      }
    },
    [dispatch]
  )

  const startRound = useCallback(async (overrideGameId) => {
    const gameId = overrideGameId ?? stateRef.current.gameId
    if (!gameId) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game' })
      return null
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.startRound({ gameId })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleAutomaticEvent(result.lastAutomaticEvent, result.players, addToast)
      handlePendingAction(result.pendingAction, result.players, addToast)
      return result
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
      return null
    }
  }, [dispatch, addToast])

  const drawCard = useCallback(async () => {
  const cur = stateRef.current

  console.log('========== BEFORE DRAW ==========')
  console.log({
    gameId: cur.gameId,
    currentPlayerId: cur.currentPlayerId,
    status: cur.status,
    pendingAction: cur.pendingAction,
  })

  dispatch({ type: 'SET_LOADING', payload: true })

  try {
    const result = await api.drawCard({
      gameId: cur.gameId,
      playerId: cur.currentPlayerId,
    })

    console.log('========== DRAW RESPONSE ==========')
    console.log(JSON.stringify(result, null, 2))

    console.log('========== SUMMARY ==========')

    result.players?.forEach((p) => {
      console.log({
        player: p.name,
        status: p.status,
        score: p.roundScore,
        cards: p.cards?.map(
          (c) =>
            c.value ??
            c.type ??
            c.modifier
        ),
      })
    })

    dispatch({ type: 'STATE_UPDATED', payload: result })

    handleAutomaticEvent(
      result.lastAutomaticEvent,
      result.players,
      addToast
    )

    handlePendingAction(
      result.pendingAction,
      result.players,
      addToast
    )

    return result
  } catch (err) {
    console.error('========== DRAW ERROR ==========')
    console.error(err)

    console.log({
      status: err.status,
      errorCode: err.errorCode,
      rawMessage: err.rawMessage,
      message: err.message,
    })

    dispatch({ type: 'SET_ERROR', payload: err.message })

    return null
  }
}, [dispatch, addToast])

  const stay = useCallback(async () => {
    const cur = stateRef.current
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.stay({
  gameId: cur.gameId,
  playerId: cur.currentPlayerId,
})

console.log('========== STAY RESPONSE ==========')
console.log(JSON.stringify(result, null, 2))

console.log('========== SUMMARY ==========')

result.players?.forEach((p) => {
  console.log({
    player: p.name,
    status: p.status,
    score: p.roundScore,
    cards: p.cards?.map(
      (c) =>
        c.value ??
        c.type ??
        c.modifier
    ),
  })
})
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleAutomaticEvent(result.lastAutomaticEvent, result.players, addToast)
      handlePendingAction(result.pendingAction, result.players, addToast)
      return result
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
      return null
    }
  }, [dispatch, addToast])

  const applyAction = useCallback(async (targetId) => {
  const cur = stateRef.current
  const pending = cur.pendingAction

  if (!pending) return null

  dispatch({ type: 'SET_LOADING', payload: true })

  try {
    console.log('========== APPLY ACTION ==========')

    console.log({
      pending,
      sourcePlayer: pending?.sourcePlayerId,
      targetPlayer: targetId,
      actionType: pending?.actionType,
    })

    const result = await api.applyAction({
      gameId: cur.gameId,
      targetPlayerId: targetId,
    })

    console.log('========== ACTION RESPONSE ==========')
    console.log(JSON.stringify(result, null, 2))

    console.log('========== SUMMARY ==========')

    result.players?.forEach((p) => {
      console.log({
        player: p.name,
        status: p.status,
        score: p.roundScore,
        cards: p.cards?.map(
          (c) =>
            c.value ??
            c.type ??
            c.modifier
        ),
      })
    })

    dispatch({ type: 'STATE_UPDATED', payload: result })

    handleAutomaticEvent(
      result.lastAutomaticEvent,
      result.players,
      addToast
    )

    handlePendingAction(
      result.pendingAction,
      result.players,
      addToast
    )

    return result
  } catch (err) {
    console.error('========== ACTION ERROR ==========')
    console.error(err)

    console.log({
      status: err.status,
      errorCode: err.errorCode,
      rawMessage: err.rawMessage,
      message: err.message,
    })

    dispatch({ type: 'SET_ERROR', payload: err.message })

    return null
  }
}, [dispatch, addToast])



  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [dispatch])

  return {
    createGame,
    startRound,
    drawCard,
    stay,
    applyAction,
    resetGame,
    addToast,
    removeToast,
  }
}

// ─── Backend event handlers ──────────────────────────────────────────────────

const playerName = (players, id) =>
  players.find((p) => p.id === id)?.name || 'Player'

// Shows the backend's automatic event (non-persistent) as a toast.
// The backend sends `lastAutomaticEvent` only when it occurred in the most
// recent mutation; it is single-use.
function handleAutomaticEvent(event, players, addToast) {
  if (!event) return
  switch (event.type) {
    case 'SECOND_CHANCE_CONSUMED':
      addToast(
        `💛 Second Chance saved ${playerName(players, event.playerId)} from being busted.`,
        'success'
      )
      break
    default:
      break
  }
}

// Shows a toast when there is a new pending action so the source player
// knows they must choose who to apply it to.
function handlePendingAction(pending, players, addToast) {
  if (!pending) return
  const name = playerName(players, pending.sourcePlayerId)
  addToast(`🎴 ${name} drew an action card — choose a target.`, 'warning')
}
