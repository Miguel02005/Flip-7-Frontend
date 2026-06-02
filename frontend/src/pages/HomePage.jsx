import { useNavigate } from 'react-router-dom'
import { useGame, useGameActions } from '../store/gameContext.jsx'

export default function HomePage() {
  const navigate = useNavigate()
  const { gameId, status } = useGame()
  const { resetGame } = useGameActions()

  const startGame = () => {
    resetGame()
    navigate('/game')
  }

  const continueGame = () => {
    navigate('/game')
  }

  const viewHistory = () => {
    navigate('/history')
  }

  return (
    <div className="home-page" data-testid="home-page" style={{ padding: 32 }}>
      <h1>Flip 7</h1>
      <p style={{ marginBottom: 24, color: 'var(--text)' }}>
        A push-your-luck card game. First to 200 points across rounds wins.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={startGame}
          className="btn btn--primary"
          data-testid="home-new-game"
        >
          New Game
        </button>
        {gameId && status !== 'GAME_OVER' && status !== 'IDLE' && (
          <button onClick={continueGame} className="btn btn--secondary">
            Continue Game
          </button>
        )}
        {gameId && (
          <button onClick={viewHistory} className="btn btn--secondary">
            View History
          </button>
        )}
      </div>
      <div style={{ marginTop: 40, fontSize: 14, color: 'var(--text)' }}>
        <h2 style={{ fontSize: 18, color: 'var(--text-h)' }}>How to play</h2>
        <ul style={{ textAlign: 'left', lineHeight: 1.6 }}>
          <li>Each round, the dealer rotates left and deals one face-up card per player.</li>
          <li>On your turn, choose <strong>Draw</strong> to add a card or <strong>Stay</strong> to bank your points.</li>
          <li>Draw a duplicate number and you bust — losing all round points.</li>
          <li>Collect 7 unique numbers for a <strong>Flip 7</strong> bonus (+15) and instant round end.</li>
          <li>Action cards (Freeze, Flip Three, Second Chance) can be aimed at any active player.</li>
          <li>First player to <strong>200 cumulative points</strong> wins at the end of a round.</li>
        </ul>
      </div>
    </div>
  )
}
