// ─────────────────────────────────────────────────────────────────────────────
// FLIP 7  —  Game Store (Context + useReducer)
//
// Single source of truth for all UI state.
// Components read via useGame(), dispatch actions via useGameActions().
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useReducer, useCallback } from 'react'
import * as api from '../services/api.js'

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // Game meta
  gameId: null,
  status: 'IDLE',           // IDLE | WAITING | IN_ROUND | ROUND_END | GAME_OVER
  currentRound: 0,
  currentPlayerId: null,
  winner: null,

  // Players
  players: [],

  // UI
  loading: false,
  error: null,
  events: [],               // latest events from backend (for animations)
  deckRemaining: 0,

  // Toast queue
  toasts: [],
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
        loading: false,
        error: null,
      }

    case 'STATE_UPDATED': {
      const { gameId, status, currentRound, currentPlayerId, winner, players, deckRemaining, events } =
        action.payload
      return {
        ...state,
        gameId,
        status,
        currentRound,
        currentPlayerId,
        winner,
        players,
        deckRemaining,
        events: events || [],
        loading: false,
        error: null,
      }
    }

    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { id: Date.now() + Math.random(), ...action.payload }],
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
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message })
      }
    },
    [dispatch]
  )

  const startRound = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.startRound({ gameId: state.gameId })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, dispatch, addToast)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }, [dispatch, state.gameId, addToast])

  const drawCard = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.drawCard({ gameId: state.gameId, playerId: state.currentPlayerId })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, dispatch, addToast)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }, [dispatch, state.gameId, state.currentPlayerId, addToast])

  const stay = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.stay({ gameId: state.gameId, playerId: state.currentPlayerId })
      dispatch({ type: 'STATE_UPDATED', payload: result })
      handleEvents(result.events, dispatch, addToast)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }, [dispatch, state.gameId, state.currentPlayerId, addToast])

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [dispatch])

  return { createGame, startRound, drawCard, stay, resetGame, addToast, removeToast }
}

// ─── Event → Toast mapper ─────────────────────────────────────────────────────

function handleEvents(events, dispatch, addToast) {
  if (!events) return
  for (const event of events) {
    switch (event.type) {
      case 'BUST':
        addToast(`💥 Bust! ${event.playerId}`, 'danger')
        break
      case 'FREEZE':
        addToast(`🧊 Freeze! Player forced to stay`, 'info')
        break
      case 'FLIP_THREE_START':
        addToast(`🃏 Flip Three! Drawing 3 cards…`, 'warning')
        break
      case 'SECOND_CHANCE_USED':
        addToast(`💛 Second Chance saved the bust!`, 'success')
        break
      case 'PLAYER_STAYED':
        addToast(`🛑 Player chose to stay`, 'info')
        break
      default:
        break
    }
  }
}