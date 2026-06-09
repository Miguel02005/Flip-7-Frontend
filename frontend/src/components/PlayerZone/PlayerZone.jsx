import { useEffect, useRef, useState } from 'react'
import { PLAYER_STATUS, PLAYER_STATUS_LABELS, CARD_TYPE } from '../../config/api.js'
import Card from '../Card/Card.jsx'
import './PlayerZone.css'

// Duración de los flashes visuales. Más cortas que el timeout del backend
// para que el efecto visual no quede "pegado" si la siguiente mutación
// llega rápido.
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
 * PlayerZone — zona de un jugador en el tablero.
 *
 * Animaciones derivadas del estado real del backend:
 *   - freeze: cuando este jugador acaba de pasar a STAYED y hay un
 *     pendingAction reciente de tipo FREEZE del que fue objetivo.
 *   - bust: cuando este jugador pasa de ACTIVE/otro estado a BUSTED.
 *
 * NO usamos eventos del store (que nunca llegan para FREEZE ni para BUST
 * de la víctima): leemos directamente los cambios de status del jugador
 * y la presencia de un pendingAction de FREEZE del que es sourcePlayerId
 * del que es objetivo.
 */
export default function PlayerZone({
  player,
  isCurrent,
  isDealer,
  isTargetable,
  onTargetClick,
  lastFreezeSourceId,
}) {
  // Refs para detectar transiciones de estado (entramos en BUSTED,
  // entramos en STAYED por freeze).
  const prevStatusRef = useRef(player.status)
  const wasFrozenRef = useRef(false)

  const [frozenFlash, setFrozenFlash] = useState(false)
  const [bustFlash, setBustFlash] = useState(false)

  // Detección de transición: el jugador acaba de pasar a BUSTED.
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

  // Detección de freeze: si el último pendingAction fue un FREEZE
  // cuyo sourcePlayerId somos nosotros (es decir, NOSOTROS robamos la
  // carta) o cuyo sourcePlayerId es OTRO y nosotros pasamos a STAYED
  // por ser el objetivo.
  // El backend aplica el efecto y limpia pendingAction; comparamos contra
  // un prop `lastFreezeSourceId` que el Board pasa cuando detecta un
  // pendingAction.type === 'FREEZE' previo.
  useEffect(() => {
    if (lastFreezeSourceId == null) {
      wasFrozenRef.current = false
      return
    }
    if (wasFrozenRef.current) return
    // Si el freeze lo robó este jugador o le fue aplicado a este jugador
    // (su estado acaba de pasar a STAYED), mostramos el flash.
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
          {isDealer && <span className="player-zone__dealer">Repartidor</span>}
          {isCurrent && (
            <span className="player-zone__current">Tu turno</span>
          )}
        </div>
        <div className={`player-zone__status ${statusBadgeClass(player.status)}`}>
          {statusLabel(player.status)}
        </div>
        <div className="player-zone__scores">
          <span>
            Ronda: <strong>{player.roundScore || 0}</strong>
          </span>
          <span>
            Total: <strong>{player.totalScore || 0}</strong>
          </span>
        </div>
        {player.flippedSeven && (
          <div className="player-zone__flip7">★ ¡Flip 7!</div>
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
          <span className="player-zone__hand-empty">(sin cartas aún)</span>
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
            ¡ELIMINADO!
          </span>
        </>
      )}
    </div>
  )
}
