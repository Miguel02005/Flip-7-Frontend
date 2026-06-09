// ─────────────────────────────────────────────────────────────────────────────
// Flip 7  —  Game Store (Context + useReducer)
//
// Fuente única de verdad para todo el estado de la UI.
// Los componentes leen con useGame() y despachan acciones con useGameActions().
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable react-refresh/only-export-components */
// Este módulo exporta un Provider y sus hooks asociados. Es el patrón
// recomendado para Context API en React: mantenerlos juntos facilita el
// fast refresh y la cohesión del módulo.

import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react'
import * as api from '../services/api.js'

// ─── Estado inicial ──────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // Metadatos del juego
  gameId: null,
  status: 'IDLE',           // IDLE | WAITING | IN_ROUND | ROUND_END | GAME_OVER
  currentRound: 0,
  currentPlayerId: null,
  dealerId: null,
  winner: null,

  // Jugadores
  players: [],

  // Acción pendiente que requiere selección de objetivo
  pendingAction: null,

  // UI
  loading: false,
  error: null,
  events: [],               // últimos eventos del backend (para animaciones)

  // Cola de toasts
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

      // El backend incluye lastAutomaticEvent (no persistente) cuando ocurrió
      // un evento automático en la mutación más reciente. Lo extraemos para
      // mostrarlo como toast y lo descartamos del estado.
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
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>')
  return ctx
}

function useDispatch() {
  const ctx = useContext(GameDispatchContext)
  if (!ctx) throw new Error('useGameActions debe usarse dentro de <GameProvider>')
  return ctx
}

// ─── Creadores de acciones ───────────────────────────────────────────────────

export function useGameActions() {
  const dispatch = useDispatch()
  const state = useGame()

  // Mantener un ref al estado más reciente para que las acciones asíncronas
  // no lean valores obsoletos (p. ej. justo después de createGame antes de
  // que React haya repintado).
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
        // 1) El backend solo devuelve { gameId } al crear.
        const { gameId } = await api.createGame({ playerNames })
        // 2) Pedimos el estado completo para tener los jugadores.
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
      dispatch({ type: 'SET_ERROR', payload: 'No hay partida activa' })
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
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.drawCard({
        gameId: cur.gameId,
        playerId: cur.currentPlayerId,
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

  const stay = useCallback(async () => {
    const cur = stateRef.current
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.stay({
        gameId: cur.gameId,
        playerId: cur.currentPlayerId,
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
      const result = await api.applyAction({
        gameId: cur.gameId,
        targetPlayerId: targetId,
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

// ─── Manejadores de eventos del backend ─────────────────────────────────────

const playerName = (players, id) =>
  players.find((p) => p.id === id)?.name || 'Jugador'

// Muestra el evento automático del backend (no persistente) como toast.
// El backend envía `lastAutomaticEvent` solo cuando ocurrió en la mutación
// más reciente; es de un solo uso.
function handleAutomaticEvent(event, players, addToast) {
  if (!event) return
  switch (event.type) {
    case 'SECOND_CHANCE_CONSUMED':
      addToast(
        `💛 Second Chance salvó a ${playerName(players, event.playerId)} del eliminado.`,
        'success'
      )
      break
    default:
      break
  }
}

// Muestra un toast cuando hay una acción pendiente nueva para que el jugador
// objetivo sepa que debe elegir a quién aplicarla.
function handlePendingAction(pending, players, addToast) {
  if (!pending) return
  const name = playerName(players, pending.sourcePlayerId)
  addToast(`🎴 ${name} robó una carta de acción — elige un objetivo.`, 'warning')
}
