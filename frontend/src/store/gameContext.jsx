// ─────────────────────────────────────────────────────────────────────────────
// FLIP 7  —  Game Store (Context + useReducer)
//
// Single source of truth for all UI state.
// Components read via useGame(), dispatch actions via useGameActions().
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react'
import * as api from '../services/api.js'

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // Game meta
  gameId: null,
  status: 'IDLE',           // IDLE | WAITING | IN_ROUND | ROUND_END | GAME_OVER
  currentRound: 0,
  currentPlayerId: null,
  dealerId: null,
  winner: null,

  // Players
  players: [],

  // Pending action awaiting target selection
  pendingAction: null,

  // UI
  loading: false,
  error: null,
  events: [],               // latest events from backend (for animations)
  deckRemaining: 0,

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

    case 'GAME_CREATED':
      return {
        ...state,
        gameId: action.payload.gameId,
        players: action.payload.players,
        status: 'WAITING',
        currentRound: 0,
        loading: false,
        error: null,
        pendingAction: null,
        roundHistory: [],
      }

    case 'STATE_UPDATED': {
      const {
        gameId,
        status,
        currentRound,
        currentPlayerId,
        dealerId,
        winner,
        players,
        deckRemaining,
        events,
        pendingAction,
      } = action.payload
      return {
        ...state,
        gameId,
        status,
        currentRound,
        currentPlayerId,
        dealerId,
        winner,
        players,
        deckRemaining,
        events: events || [],
        pendingAction: pendingAction || null,
        loading: false,
        error: null,
        roundHistory: action.payload.roundHistory || state.roundHistory,
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

// ─── Contexts ─────────────────────────────────────────────────────────────────

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
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}

function useDispatch() {
  const ctx = useContext(GameDispatchContext)
  if (!ctx) throw new Error('useGameActions must be used inside <GameProvider>')
  return ctx
}

// ─── Action creators (thunk-like with dispatch) ───────────────────────────────

export function useGameActions() {
  const dispatch = useDispatch()
  const state = useGame()

  // Keep a ref to the latest state so async actions don't read stale values
  // (e.g. right after createGame before React re-renders).
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
        const result = await api.createGame({ playerNames })
        dispatch({ type: 'GAME_CREATED', payload: result })
        return result
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message })
        return null
      }
    },
    [dispatch]
  )

  const startRound = useCallback(async (overrideGameId) => {
    // Allow callers to pass the gameId explicitly so we don't read a stale
    // value from the closure (e.g. right after createGame before React has
    // re-rendered with the new state).
    const gameId = overrideGameId ?? stateRef.current.gameId
    if (!gameId) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game' })
      return null
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.startRound({ gameId })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, stateRef.current.players, addToast)
      return result
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
      return null
    }
  }, [dispatch, addToast])

  const drawCard = useCallback(async () => {
    const cur = stateRef.current
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.drawCard({
        gameId: cur.gameId,
        playerId: cur.currentPlayerId,
      })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, cur.players, addToast)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
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
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, cur.players, addToast)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }, [dispatch, addToast])

  const applyAction = useCallback(
    async (targetId) => {
      const cur = stateRef.current
      const pending = cur.pendingAction
      if (!pending) return
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const result = await api.applyAction({
          gameId: cur.gameId,
          sourcePlayerId: pending.sourcePlayerId,
          targetId,
        })
        dispatch({ type: 'STATE_UPDATED', payload: result })
        handleEvents(result.events, cur.players, addToast)
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message })
      }
    },
    [dispatch, addToast]
  )

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

// ─── Event → Toast mapper ─────────────────────────────────────────────────────

function handleEvents(events, players, addToast) {
  if (!events) return
  const playerName = (id) =>
    players.find((p) => p.id === id)?.name || 'Player'

  for (const event of events) {
    switch (event.type) {
      case 'BUST':
        addToast(`💥 ${playerName(event.playerId)} busts!`, 'danger')
        break
      case 'FREEZE':
        addToast(
          `🧊 ${playerName(event.playerId)} frozen — must stay!`,
          'info'
        )
        break
      case 'FLIP_THREE_START':
        addToast(
          `🃏 Flip Three! ${playerName(event.playerId)} draws 3…`,
          'warning'
        )
        break
      case 'FLIP_THREE_END':
        addToast(`✅ Flip Three resolved.`, 'info')
        break
      case 'SECOND_CHANCE_USED':
        addToast(
          `💛 Second Chance saved ${playerName(event.playerId)} from busting!`,
          'success'
        )
        break
      case 'SECOND_CHANCE_RECEIVED':
        addToast(
          `💛 ${playerName(event.playerId)} received Second Chance.`,
          'success'
        )
        break
      case 'SECOND_CHANCE_REDIRECTED':
        addToast(
          `↪️ Second Chance passed to ${playerName(event.playerId)}.`,
          'info'
        )
        break
      case 'SECOND_CHANCE_DISCARDED':
        addToast(`Second Chance discarded (no eligible player).`, 'info')
        break
      case 'PLAYER_STAYED':
        addToast(`🛑 ${playerName(event.playerId)} stays.`, 'info')
        break
      case 'ACTION_DRAWN':
        addToast(
          `🎴 ${playerName(event.playerId)} drew an action card — pick a target!`,
          'warning'
        )
        break
      default:
        break
    }
  }
}
