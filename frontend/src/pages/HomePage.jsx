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
        <div className="lobby__card lobby__card--3 card--num-9">
          <span className="lobby__card-num">9</span>
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
          A card game of "risk it for the biscuit." Be the first to reach 200
          points across rounds to win.
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
          <h2>How to Play</h2>
          <ul>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--deal">Deal</span>
              Each round, the dealer rotates to the left and deals one card
              face up to each player.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--draw">Draw</span>
              On your turn, choose <strong>Draw</strong> to add a card or{' '}
              <strong>Stay</strong> to lock in your points.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--bust">Busted</span>
              Draw a duplicate number and you're busted: you lose all of the
              round's points.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--flip7">Flip 7</span>
              Collect 7 unique numbers for a <strong>+15 bonus</strong> and
              the round ends instantly.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--action">Action</span>
              Freeze, Flip Three, and Second Chance can be aimed at any
              active player.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--win">200</span>
              The first player to reach <strong>200 cumulative points</strong>{' '}
              wins at the end of a round.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
