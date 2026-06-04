import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useGameActions } from '../store/gameContext.jsx'
import Board from '../components/Board/Board.jsx'
import ActionPanel from '../components/ActionPanel/ActionPanel.jsx'
import GameSetup from '../components/GameSetup/GameSetup.jsx'
import ScoreBoard from '../components/ScoreBoard/ScoreBoard.jsx'
import WinnerModal from '../components/WinnerModal/WinnerModal.jsx'
import { PLAYER_STATUS } from '../services/mock/mockData.js'
// try jeje
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
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null)

  // Auto-start a round once the game has been created
  useEffect(() => {
    if (game.status === 'WAITING' && game.gameId) {
      // Don't auto-start — let the user click "Start Round" after seeing setup
    }
  }, [game.status, game.gameId])

  // Auto-advance to the next round after ROUND_END
  useEffect(() => {
    if (game.status === 'ROUND_END') {
      const t = setTimeout(() => {
        startRound()
      }, 5000)
      setAutoAdvanceTimer(t)
      return () => {
        clearTimeout(t)
        setAutoAdvanceTimer(null)
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
      // Pass the new gameId explicitly so startRound doesn't read a stale
      // gameId from the context closure (which still holds the pre-create state).
      await startRound(result.gameId)
    }
  }

  const handleStartNext = () => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      setAutoAdvanceTimer(null)
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

  // No game yet — show setup
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
    <div className="game-page" data-testid="game-page" style={{ padding: 16 }}>
      <Board
        players={game.players}
        currentPlayerId={game.currentPlayerId}
        dealerId={game.dealerId}
        pendingAction={pendingActionWithName}
        status={game.status}
        currentRound={game.currentRound}
        winner={game.winner}
        deckRemaining={game.deckRemaining}
        roundHistory={game.roundHistory}
        loading={game.loading}
        onPlayerTargetClick={handlePlayerTarget}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ScoreBoard players={game.players} />
        </div>
      </Board>

      <div className="board__controls" style={{ marginTop: 16 }}>
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

      {game.status === 'GAME_OVER' && game.winner && (
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
