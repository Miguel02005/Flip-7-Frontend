import { useNavigate } from 'react-router-dom'
import { useGame, useGameActions } from '../store/gameContext.jsx'
import './HomePage.css'

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
    <div className="home-page lobby" data-testid="home-page">
      <div className="lobby__cards" aria-hidden="true">
        <div className="lobby__card lobby__card--1 card--num-0">0</div>
        <div className="lobby__card lobby__card--2 card--num-5">5</div>
        <div className="lobby__card lobby__card--3 card--num-7">7</div>
        <div className="lobby__card lobby__card--4 card--num-12">12</div>
      </div>

      <div className="lobby__content">
        <h1 className="lobby__title">Flip 7</h1>
        <p className="lobby__tagline">
          A push-your-luck card game. First to 200 points across rounds wins.
        </p>
        <div className="lobby__actions">
          <button
            onClick={startGame}
            className="btn lobby__play"
            data-testid="home-new-game"
          >
            <span className="lobby__play-icon" aria-hidden="true">▶</span>
            New Game
          </button>
          {gameId && status !== 'GAME_OVER' && status !== 'IDLE' && (
            <button onClick={continueGame} className="btn lobby__secondary">
              Continue Game
            </button>
          )}
          {gameId && (
            <button onClick={viewHistory} className="btn lobby__secondary">
              View History
            </button>
          )}
        </div>
        <div className="lobby__howto">
          <h2>How to play</h2>
          <ul>
            <li>Each round, the dealer rotates left and deals one face-up card per player.</li>
            <li>On your turn, choose <strong>Draw</strong> to add a card or <strong>Stay</strong> to bank your points.</li>
            <li>Draw a duplicate number and you bust — losing all round points.</li>
            <li>Collect 7 unique numbers for a <strong>Flip 7</strong> bonus (+15) and instant round end.</li>
            <li>Action cards (Freeze, Flip Three, Second Chance) can be aimed at any active player.</li>
            <li>First player to <strong>200 cumulative points</strong> wins at the end of a round.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
