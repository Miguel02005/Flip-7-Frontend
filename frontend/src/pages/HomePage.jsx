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
          Un juego de cartas de "arriesgarte a más". El primero en llegar a 200
          puntos en rondas gana.
        </p>
        <div className="lobby__actions">
          <button
            onClick={startGame}
            className="btn lobby__play"
            data-testid="home-new-game"
          >
            <span className="lobby__play-icon" aria-hidden="true">▶</span>
            Jugar
          </button>
          {gameId && status !== 'GAME_OVER' && status !== 'IDLE' && (
            <button onClick={continueGame} className="btn lobby__secondary">
              Continuar partida
            </button>
          )}
          {gameId && (
            <button onClick={viewHistory} className="btn lobby__secondary">
              Ver historial
            </button>
          )}
        </div>
        <div className="lobby__howto">
          <h2>Cómo jugar</h2>
          <ul>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--deal">Repartir</span>
              Cada ronda, el repartidor rota a la izquierda y reparte una carta
              boca arriba a cada jugador.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--draw">Robar</span>
              En tu turno, elige <strong>Robar</strong> para añadir una carta o{' '}
              <strong>Plantarte</strong> para asegurar tus puntos.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--bust">Eliminado</span>
              Roba un número duplicado y quedas eliminado: pierdes todos los
              puntos de la ronda.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--flip7">Flip 7</span>
              Consigue 7 números únicos para un <strong>bono de +15</strong> y
              fin instantáneo de la ronda.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--action">Acción</span>
              Freeze, Flip Three y Second Chance pueden dirigirse a
              cualquier jugador activo.
            </li>
            <li>
              <span className="lobby__howto-tag lobby__howto-tag--win">200</span>
              El primer jugador en alcanzar <strong>200 puntos acumulados</strong>{' '}
              gana al final de una ronda.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
