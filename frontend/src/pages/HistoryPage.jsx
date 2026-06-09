import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/gameContext.jsx'
import { getGameState } from '../services/api.js'

export default function HistoryPage() {
  const { gameId } = useGame()
  const navigate = useNavigate()
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!gameId) {
        setHistory(null)
        return
      }
      try {
        const state = await getGameState({ gameId })
        if (cancelled) return
        // Adaptamos el shape de GameResponse al formato que la UI espera:
        // { winner, rounds: [{ roundNumber, scores: [...] }] }
        setHistory({
          winner: state.winner,
          rounds: state.roundHistory || [],
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [gameId])

  if (!gameId) {
    return (
      <div style={{ padding: 32 }} data-testid="history-page">
        <h1>Historial</h1>
        <p>No hay partida en curso.</p>
        <button onClick={() => navigate('/')} className="btn btn--primary">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 32 }} data-testid="history-page">
      <h1>Historial de la partida</h1>
      {error && <p style={{ color: '#c2185b' }}>Error: {error}</p>}
      {history && (
        <>
          {history.winner && (
            <div className="board__winner-banner" data-testid="history-winner">
              🏆 {history.winner.name} ganó con {history.winner.totalScore}{' '}
              puntos.
            </div>
          )}
          <h2>Rondas</h2>
          {history.rounds.length === 0 ? (
            <p>Aún no se han jugado rondas.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 12,
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Ronda
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Jugador
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Resultado
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Puntaje
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.rounds.flatMap((r) =>
                  r.scores.map((s, idx) => (
                    <tr key={`${r.roundNumber}-${s.playerId}`}>
                      <td
                        style={{
                          padding: 8,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {idx === 0 ? r.roundNumber : ''}
                      </td>
                      <td
                        style={{
                          padding: 8,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {s.playerName}
                      </td>
                      <td
                        style={{
                          padding: 8,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {s.flippedSeven
                          ? '⭐ Flip 7'
                          : s.busted
                          ? 'Eliminado'
                          : 'Plantado'}
                      </td>
                      <td
                        style={{
                          padding: 8,
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'right',
                        }}
                      >
                        {s.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn--secondary"
        >
          Volver al inicio
        </button>
        {history && history.rounds.length > 0 && (
          <button
            onClick={() => navigate('/game')}
            className="btn btn--primary"
            style={{ marginLeft: 8 }}
          >
            Volver a la partida
          </button>
        )}
      </div>
    </div>
  )
}
