import { useState } from 'react'
import './GameSetup.css'

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4']

export default function GameSetup({ onStart, loading, error }) {
  const [names, setNames] = useState(DEFAULT_NAMES)

  const setNameAt = (i, value) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)))
  }

  const removeAt = (i) => {
    setNames((prev) => prev.filter((_, idx) => idx !== i))
  }

  const addPlayer = () => {
    if (names.length >= 8) return
    setNames((prev) => [...prev, `Player ${prev.length + 1}`])
  }

  const handleStart = () => {
    const cleaned = names
      .map((n) => (n || '').trim())
      .filter((n) => n.length > 0)
    onStart(cleaned)
  }

  const canStart = names.filter((n) => n.trim().length > 0).length >= 2

  return (
    <div className="game-setup" data-testid="game-setup">
      <div className="game-setup__title">New Game</div>
      <div className="game-setup__subtitle">
        Add 2 to 8 players. The first to reach 200 wins.
      </div>
      <div className="game-setup__players">
        {names.map((name, i) => (
          <div className="game-setup__player-row" key={i}>
            <input
              type="text"
              value={name}
              onChange={(e) => setNameAt(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              data-testid={`player-name-input-${i}`}
              maxLength={20}
            />
            <button
              type="button"
              className="game-setup__remove"
              onClick={() => removeAt(i)}
              disabled={names.length <= 2}
              data-testid={`remove-player-${i}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="game-setup__add"
        onClick={addPlayer}
        disabled={names.length >= 8}
        data-testid="add-player"
      >
        + Add player
      </button>
      <button
        type="button"
        className="game-setup__start"
        onClick={handleStart}
        disabled={!canStart || loading}
        data-testid="start-game"
      >
        {loading ? 'Starting...' : 'Start Game'}
      </button>
      {error && <div className="game-setup__error">{error}</div>}
    </div>
  )
}
