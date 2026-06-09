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
        // Adapt the GameResponse shape to the format the UI expects:
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
        <h1>History</h1>
        <p>No game in progress.</p>
        <button onClick={() => navigate('/')} className="btn btn--primary">
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 32 }} data-testid="history-page">
      <h1>Game History</h1>
      {error && <p style={{ color: '#c2185b' }}>Error: {error}</p>}
      {history && (
        <>
          {history.winner && (
            <div className="board__winner-banner" data-testid="history-winner">
              🏆 {history.winner.name} won with {history.winner.totalScore}{' '}
              points.
            </div>
          )}
          <h2>Rounds</h2>
          {history.rounds.length === 0 ? (
            <p>No rounds have been played yet.</p>
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
                    Round
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Player
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Result
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Score
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
                          ? 'Busted'
                          : 'Stayed'}
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
          Back to Home
        </button>
        {history && history.rounds.length > 0 && (
          <button
            onClick={() => navigate('/game')}
            className="btn btn--primary"
            style={{ marginLeft: 8 }}
          >
            Back to Game
          </button>
        )}
      </div>
    </div>
  )
}
