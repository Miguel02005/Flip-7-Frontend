import './ScoreBoard.css'

export default function ScoreBoard({ players, winThreshold = 200 }) {
  if (!players || players.length === 0) return null

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore)
  const leaderScore = sorted[0]?.totalScore || 0

  return (
    <div className="score-board" data-testid="score-board">
      <div className="score-board__title">Scoreboard</div>
      {sorted.map((p) => (
        <div
          key={p.id}
          className={
            'score-board__row' +
            (p.totalScore === leaderScore && leaderScore > 0
              ? ' score-board__row--leader'
              : '')
          }
        >
          <span className="score-board__name">{p.name}</span>
          <span>
            <span className="score-board__total">{p.totalScore}</span>
            <span className="score-board__round">
              /{winThreshold}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
