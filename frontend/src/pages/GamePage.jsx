import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useGameActions } from '../store/gameContext.jsx'
import { STATUS, PLAYER_STATUS } from '../config/api.js'
import Board from '../components/Board/Board.jsx'
import ActionPanel from '../components/ActionPanel/ActionPanel.jsx'
import GameSetup from '../components/GameSetup/GameSetup.jsx'
import ScoreBoard from '../components/ScoreBoard/ScoreBoard.jsx'
import WinnerModal from '../components/WinnerModal/WinnerModal.jsx'

export default function GamePage() {
  const game = useGame()
  const {
    createGame,
    startRound,
    drawCard,
    stay,
    applyAction,
    resetGame,
  } = useGameActions()
  const navigate = useNavigate()
  // Auto-advance timer ID. We use useRef (not useState) because
  // we don't need to re-render when assigning it: we only use it to cancel
  // from handleStartNext when the user clicks manually.
  const autoAdvanceTimerRef = useRef(null)

  // Auto-advance to the next round after ROUND_END (5 s)
  useEffect(() => {
    if (game.status === STATUS.ROUND_END) {
      const t = setTimeout(() => {
        startRound()
      }, 5000)
      autoAdvanceTimerRef.current = t
      return () => {
        clearTimeout(t)
        autoAdvanceTimerRef.current = null
      }
    }
    return undefined
  }, [game.status, startRound])

  const currentPlayer = useMemo(
    () => game.players.find((p) => p.id === game.currentPlayerId) || null,
    [game.players, game.currentPlayerId]
  )

  const activePlayers = useMemo(
    () => game.players.filter((p) => p.status === PLAYER_STATUS.ACTIVE),
    [game.players]
  )

  const pendingActionWithName = useMemo(() => {
    if (!game.pendingAction) return null
    const sourceName = game.players.find(
      (p) => p.id === game.pendingAction.sourcePlayerId
    )?.name
    return { ...game.pendingAction, sourcePlayerName: sourceName }
  }, [game.pendingAction, game.players])

  const handleStart = async (playerNames) => {
    const result = await createGame(playerNames)
    if (result && result.gameId) {
      // We pass gameId explicitly so startRound doesn't read a stale
      // value from the context (which still contains the pre-creation state).
      await startRound(result.gameId)
    }
  }

  const handleStartNext = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
    startRound()
  }

  const handleNewGame = () => {
    resetGame()
    navigate('/')
  }

  const handlePlayerTarget = (targetId) => {
    applyAction(targetId)
  }

  // No game yet: show setup
  if (!game.gameId) {
    return (
      <div className="game-page" style={{ padding: 16 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1>Flip 7</h1>
          <GameSetup
            onStart={handleStart}
            loading={game.loading}
            error={game.error}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="game-page" data-testid="game-page">
      <Board
        players={game.players}
        currentPlayerId={game.currentPlayerId}
        dealerId={game.dealerId}
        pendingAction={pendingActionWithName}
        status={game.status}
        currentRound={game.currentRound}
        winner={game.winner}
        roundHistory={game.roundHistory}
        loading={game.loading}
        onPlayerTargetClick={handlePlayerTarget}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <ScoreBoard players={game.players} />
        </div>
      </Board>

      <div className="board__controls board__controls--sticky">
        <ActionPanel
          status={game.status}
          currentPlayer={currentPlayer}
          pendingAction={pendingActionWithName}
          activePlayers={activePlayers}
          loading={game.loading}
          onDraw={drawCard}
          onStay={stay}
          onApplyAction={applyAction}
          onStartNextRound={handleStartNext}
          onStartFirstRound={handleStartNext}
          onNewGame={handleNewGame}
        />
      </div>

      {game.status === STATUS.GAME_OVER && game.winner && (
        <WinnerModal
          winner={game.winner}
          players={game.players}
          onClose={() => navigate('/')}
        />
      )}

      {game.error && (
        <div
          className="toast toast--danger"
          style={{ position: 'fixed', bottom: 16, left: 16 }}
          data-testid="error-toast"
        >
          {game.error}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={() => navigate('/history')}
          className="btn btn--secondary"
          data-testid="nav-history"
        >
          View History
        </button>
        <button
          onClick={handleNewGame}
          className="btn btn--secondary"
          style={{ marginLeft: 8 }}
          data-testid="reset-game"
        >
          Reset Game
        </button>
      </div>
    </div>
  )
}
