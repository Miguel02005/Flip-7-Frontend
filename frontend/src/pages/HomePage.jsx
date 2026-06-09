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
        <div className="lobby__card lobby__card--1 card--num-0">
          <span className="lobby__card-num">0</span>
        </div>
        <div className="lobby__card lobby__card--2 card--num-5">
          <span className="lobby__card-num">5</span>
        </div>
        <div className="lobby__card lobby__card--3 card--num-7">
          <span className="lobby__card-num">7</span>
        </div>
        <div className="lobby__card lobby__card--4 card--num-12">
          <span className="lobby__card-num">12</span>
        </div>
      </div>

      <div className="lobby__content">
        <h1 className="lobby__title">
          <span className="lobby__title-flip">FLIP</span>
          <span className="lobby__title-seven">7</span>
        </h1>
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
            Play
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
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--deal">Deal</span>
              Each round, the dealer rotates left and deals one face-up card per player.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--draw">Draw</span>
              On your turn, choose <strong>Draw</strong> to add a card or <strong>Stay</strong> to bank your points.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--bust">Bust</span>
              Draw a duplicate number and you bust — losing all round points.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--flip7">Flip 7</span>
              Collect 7 unique numbers for a <strong>+15 bonus</strong> and instant round end.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--action">Action</span>
              Freeze, Flip Three, and Second Chance can be aimed at any active player.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--win">200</span>
              First player to <strong>200 cumulative points</strong> wins at the end of a round.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
