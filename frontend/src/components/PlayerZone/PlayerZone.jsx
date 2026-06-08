import { useEffect, useRef, useState } from 'react'
import { PLAYER_STATUS } from '../../services/mock/mockData.js'
import { useGame } from '../../store/gameContext.jsx'
import Card from '../Card/Card.jsx'
import './PlayerZone.css'

const FREEZE_DURATION_MS = 1800
const BUST_DURATION_MS = 800

function statusLabel(status) {
  if (status === PLAYER_STATUS.BUSTED) return 'BUSTED'
  if (status === PLAYER_STATUS.STAYED) return 'STAYED'
  return 'ACTIVE'
}

function statusClass(status) {
  if (status === PLAYER_STATUS.BUSTED) return 'player-zone--busted'
  if (status === PLAYER_STATUS.STAYED) return 'player-zone--stayed'
  return ''
}

function statusBadgeClass(status) {
  if (status === PLAYER_STATUS.BUSTED) return 'player-zone__status--busted'
  if (status === PLAYER_STATUS.STAYED) return 'player-zone__status--stayed'
  return 'player-zone__status--active'
}

export default function PlayerZone({
  player,
  isCurrent,
  isDealer,
  isTargetable,
  onTargetClick,
}) {
  const { events } = useGame()
  const [frozen, setFrozen] = useState(false)
  const [bustedAnim, setBustedAnim] = useState(false)
  const seenEventsRef = useRef([])

  useEffect(() => {
    if (!events || events.length === 0) return
    const prev = seenEventsRef.current
    const newEvents = events.filter((e) => !prev.includes(e))
    seenEventsRef.current = events

    if (newEvents.length === 0) return

    const freezeEvent = newEvents.find(
      (e) => e.type === 'FREEZE' && e.playerId === player.id
    )
    const bustEvent = newEvents.find(
      (e) => e.type === 'BUST' && e.playerId === player.id
    )

    if (freezeEvent) {
      setFrozen(true)
      const t = setTimeout(() => setFrozen(false), FREEZE_DURATION_MS)
      return () => clearTimeout(t)
    }
    if (bustEvent) {
      setBustedAnim(true)
      const t = setTimeout(() => setBustedAnim(false), BUST_DURATION_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [events, player.id])

  if (!player) return null

  const hand = player.hand || []
  const classes = [
    'player-zone',
    statusClass(player.status),
    isCurrent ? 'player-zone--current' : '',
    isTargetable ? 'player-zone--target' : '',
    frozen ? 'player-zone--frozen' : '',
    bustedAnim ? 'player-zone--busted-anim' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      onClick={isTargetable ? () => onTargetClick?.(player.id) : undefined}
      data-testid={`player-zone-${player.id}`}
      data-player-id={player.id}
    >
      <div className="player-zone__header">
        <div className="player-zone__name">
          {player.name}
          {isDealer && <span className="player-zone__dealer">Dealer</span>}
          {isCurrent && (
            <span className="player-zone__current">Your Turn</span>
          )}
        </div>
        <div className={`player-zone__status ${statusBadgeClass(player.status)}`}>
          {statusLabel(player.status)}
        </div>
        <div className="player-zone__scores">
          <span>
            Round: <strong>{player.roundScore || 0}</strong>
          </span>
          <span>
            Total: <strong>{player.totalScore || 0}</strong>
          </span>
        </div>
        {player.flippedSeven && (
          <div className="player-zone__flip7">★ Flip 7!</div>
        )}
        {player.secondChance && (
          <div className="player-zone__dealer" style={{ background: '#d8f5d0', color: '#1b5e20' }}>
            ♥ 2nd Chance
          </div>
        )}
      </div>

      <div className="player-zone__hand">
        {hand.length === 0 ? (
          <span className="player-zone__hand-empty">(no cards yet)</span>
        ) : (
          hand.map((card) => (
            <Card key={card.id} card={card} small />
          ))
        )}
      </div>

      {frozen && (
        <span className="player-zone__snowflake" aria-hidden="true">
          ❄
        </span>
      )}
      {bustedAnim && (
        <span className="player-zone__bust-text" aria-hidden="true">
          BUST!
        </span>
      )}
    </div>
  )
}
