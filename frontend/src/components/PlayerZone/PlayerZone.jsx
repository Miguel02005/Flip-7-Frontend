import { useEffect, useRef, useState } from 'react'
import { PLAYER_STATUS, PLAYER_STATUS_LABELS, CARD_TYPE } from '../../config/api.js'
import Card from '../Card/Card.jsx'
import './PlayerZone.css'

// Visual flash durations. Shorter than the backend timeout so the
// visual effect doesn't get "stuck" if the next mutation arrives quickly.
const FREEZE_FLASH_MS = 1800
const BUST_FLASH_MS = 900

function statusLabel(status) {
  return PLAYER_STATUS_LABELS[status] || status
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

function hasSecondChance(player) {
  return Array.isArray(player.cards) &&
    player.cards.some((c) => c.type === CARD_TYPE.SECOND_CHANCE)
}

/**
 * PlayerZone — a player's area on the board.
 *
 * Animations derived from the actual backend state:
 *   - freeze: when this player just transitioned to STAYED and there's a
 *     recent pendingAction of type FREEZE of which they were the target.
 *   - bust: when this player transitions from ACTIVE/another status to BUSTED.
 *
 * We do NOT use store events (which never arrive for FREEZE nor for BUST
 * of the victim): we read the player's status changes directly and the
 * presence of a pendingAction of FREEZE whose sourcePlayerId is the one
 * who is the target.
 */
export default function PlayerZone({
  player,
  isCurrent,
  isDealer,
  isTargetable,
  onTargetClick,
  lastFreezeSourceId,
}) {
  // Refs to detect state transitions (we enter BUSTED,
  // we enter STAYED from a freeze).
  const prevStatusRef = useRef(player.status)
  const wasFrozenRef = useRef(false)

  const [frozenFlash, setFrozenFlash] = useState(false)
  const [bustFlash, setBustFlash] = useState(false)

  // Transition detection: the player just transitioned to BUSTED.
  useEffect(() => {
    const prev = prevStatusRef.current
    if (prev !== PLAYER_STATUS.BUSTED && player.status === PLAYER_STATUS.BUSTED) {
      setBustFlash(true)
      const t = setTimeout(() => setBustFlash(false), BUST_FLASH_MS)
      prevStatusRef.current = player.status
      return () => clearTimeout(t)
    }
    prevStatusRef.current = player.status
    return undefined
  }, [player.status])

  // Freeze detection: if the last pendingAction was a FREEZE
  // whose sourcePlayerId is us (i.e. WE drew the card) or whose
  // sourcePlayerId is SOMEONE ELSE and we transitioned to STAYED
  // because we were the target.
  // The backend applies the effect and clears pendingAction; we compare
  // against a `lastFreezeSourceId` prop that the Board passes when it
  // detects a previous pendingAction.type === 'FREEZE'.
  useEffect(() => {
    if (lastFreezeSourceId == null) {
      wasFrozenRef.current = false
      return
    }
    if (wasFrozenRef.current) return
    // If this player drew the freeze or it was applied to this player
    // (their status just transitioned to STAYED), show the flash.
    const isSource = lastFreezeSourceId === player.id
    const isStayedByFreeze =
      player.status === PLAYER_STATUS.STAYED &&
      prevStatusRef.current !== PLAYER_STATUS.STAYED
    if (isSource || isStayedByFreeze) {
      wasFrozenRef.current = true
      setFrozenFlash(true)
      const t = setTimeout(() => setFrozenFlash(false), FREEZE_FLASH_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [lastFreezeSourceId, player.id, player.status])

  if (!player) return null

  const cards = player.cards || []
  const isFrozenPersistent =
    !frozenFlash &&
    player.status === PLAYER_STATUS.STAYED &&
    lastFreezeSourceId == null

  const classes = [
    'player-zone',
    statusClass(player.status),
    isCurrent ? 'player-zone--current' : '',
    isTargetable ? 'player-zone--target' : '',
    frozenFlash ? 'player-zone--frozen' : '',
    isFrozenPersistent ? 'player-zone--frozen-static' : '',
    bustFlash ? 'player-zone--busted-anim' : '',
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
            <span className="player-zone__current">Your turn</span>
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
        {hasSecondChance(player) && (
          <div
            className="player-zone__dealer"
            style={{ background: '#d8f5d0', color: '#1b5e20' }}
          >
            ♥ Second Chance
          </div>
        )}
      </div>

      <div className="player-zone__hand">
        {cards.length === 0 ? (
          <span className="player-zone__hand-empty">(no cards yet)</span>
        ) : (
          cards.map((card) => <Card key={card.id} card={card} small />)
        )}
      </div>

      {frozenFlash && (
        <>
          <span className="player-zone__snowflake" aria-hidden="true">
            ❄
          </span>
          <span className="player-zone__snowflake player-zone__snowflake--2" aria-hidden="true">
            ❅
          </span>
          <span className="player-zone__snowflake player-zone__snowflake--3" aria-hidden="true">
            ❆
          </span>
          <span className="player-zone__freeze-label" aria-hidden="true">
            FROZEN
          </span>
        </>
      )}
      {bustFlash && (
        <>
          <span className="player-zone__bust-text" aria-hidden="true">
            BUSTED!
          </span>
        </>
      )}
    </div>
  )
}
