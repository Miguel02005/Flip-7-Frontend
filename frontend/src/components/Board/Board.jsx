import { STATUS, STATUS_LABELS } from '../../config/api.js'
import PlayerZone from '../PlayerZone/PlayerZone.jsx'
import './Board.css'

export default function Board({
  players,
  currentPlayerId,
  dealerId,
  pendingAction,
  status,
  currentRound,
  winner,
  roundHistory,
  onPlayerTargetClick,
  children,
}) {
  const lastRound =
    roundHistory && roundHistory.length > 0
      ? roundHistory[roundHistory.length - 1]
      : null

  return (
    <div className="board" data-testid="board">
      <div className="board__top">
        <div className="board__title-block">
          <div className="board__title">Flip 7</div>
          {currentRound > 0 && (
            <div className="board__round-info">
              Ronda <strong>{currentRound}</strong> ·{' '}
              <span data-testid="game-status">
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          )}
        </div>
        {children}
      </div>

      {status === STATUS.GAME_OVER && winner && (
        <div className="board__winner-banner" data-testid="winner-banner">
          🏆 ¡{winner.name} gana con {winner.totalScore} puntos!
        </div>
      )}

      {status === STATUS.ROUND_END && lastRound && (
        <div className="board__round-summary" data-testid="round-summary">
          <h3>Resumen de la ronda {lastRound.roundNumber}</h3>
          <table>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Resultado</th>
                <th>Puntaje de ronda</th>
              </tr>
            </thead>
            <tbody>
              {lastRound.scores.map((s) => {
                const variant = s.flippedSeven
                  ? 'flip7'
                  : s.busted
                  ? 'bust'
                  : 'stayed'
                return (
                  <tr key={s.playerId}>
                    <td>{s.playerName}</td>
                    <td>
                      <span className={`summary-badge summary-badge--${variant}`}>
                        {s.flippedSeven
                          ? '⭐ Flip 7'
                          : s.busted
                          ? 'Eliminado'
                          : 'Plantado'}
                      </span>
                    </td>
                    <td className="board__round-score">{s.score}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="board__table" data-testid="board-table">
        {players.length === 0 ? (
          <div className="board__table-empty">
            Aún no hay jugadores; inicia una partida con el panel de arriba.
          </div>
        ) : (
          players.map((p) => (
            <PlayerZone
              key={p.id}
              player={p}
              isCurrent={p.id === currentPlayerId && status === STATUS.IN_ROUND}
              isDealer={p.id === dealerId}
              isTargetable={
                !!pendingAction &&
                p.status === 'ACTIVE' &&
                p.id !== pendingAction.sourcePlayerId
              }
              onTargetClick={onPlayerTargetClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
