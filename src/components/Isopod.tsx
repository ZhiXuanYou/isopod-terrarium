import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import fedHappy from '../assets/ui/fed_happy.png'
import {
  chooseDestination,
  EATING_BOB_DISTANCE_MAX_PX,
  EATING_BOB_DISTANCE_MIN_PX,
  EATING_BOB_INTERVAL_MAX_MS,
  EATING_BOB_INTERVAL_MIN_MS,
  FED_HAPPY_DURATION_MS,
  FACING_DEAD_ZONE,
  FOOD_GATHERING_SLOTS,
  getMovementDuration,
  ISOPOD_TIMING,
  randomDuration,
  type Facing,
  type IsopodState,
  type Position,
} from '../game/isopodConfig'
import type { IsopodSpeciesDefinition } from '../game/isopodSpecies'

interface IsopodProps {
  id: string
  species: IsopodSpeciesDefinition
  initialPosition: Position
  initialFacing?: Facing
  satiety: number
  displayName: string
  actorLabel: string
  fedHappySignal: number
  onShowInfo: (id: string) => void
  foodTaskRevision: number | null
  foodSlotIndex: number | null
  getFoodApproachPosition: (slotIndex: number) => Position | null
  onStateChange: (id: string, state: IsopodState) => void
  onFoodTaskArrival: (id: string) => void
  onFoodTaskCancel: (id: string) => void
}

function Isopod({
  id,
  species,
  initialPosition,
  initialFacing = 'left',
  satiety,
  displayName,
  actorLabel,
  fedHappySignal,
  onShowInfo,
  foodTaskRevision,
  foodSlotIndex,
  getFoodApproachPosition,
  onStateChange,
  onFoodTaskArrival,
  onFoodTaskCancel,
}: IsopodProps) {
  const { idle: idleFrames, walk: walkFrames, roll: rollFrames } =
    species.sprites
  const actorRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<IsopodState>('IDLE')
  const [position, setPosition] = useState(initialPosition)
  const [facing, setFacing] = useState<Facing>(initialFacing)
  const [frameIndex, setFrameIndex] = useState(0)
  const [movementDuration, setMovementDuration] = useState(0)
  const [idleDuration, setIdleDuration] = useState(() =>
    randomDuration(ISOPOD_TIMING.initialIdleMinMs, ISOPOD_TIMING.initialIdleMaxMs),
  )
  const [showFedHappy, setShowFedHappy] = useState(false)
  const [eatingMotion] = useState(() => ({
    distance: randomDuration(
      EATING_BOB_DISTANCE_MIN_PX,
      EATING_BOB_DISTANCE_MAX_PX,
    ),
    duration: randomDuration(
      EATING_BOB_INTERVAL_MIN_MS,
      EATING_BOB_INTERVAL_MAX_MS,
    ),
    phaseOffset: randomDuration(0, EATING_BOB_INTERVAL_MAX_MS),
  }))

  useEffect(() => {
    if (fedHappySignal === 0) {
      return undefined
    }

    setShowFedHappy(true)
    const happyTimer = window.setTimeout(() => {
      setShowFedHappy(false)
    }, FED_HAPPY_DURATION_MS)

    return () => window.clearTimeout(happyTimer)
  }, [fedHappySignal])

  useEffect(() => {
    onStateChange(id, state)
  }, [id, onStateChange, state])

  function getRenderedPosition() {
    const isopodElement = actorRef.current
    const habitatElement = isopodElement?.parentElement

    if (!isopodElement || !habitatElement) {
      return position
    }

    const isopodBounds = isopodElement.getBoundingClientRect()
    const habitatBounds = habitatElement.getBoundingClientRect()

    return {
      x:
        ((isopodBounds.left - habitatBounds.left - habitatElement.clientLeft) /
          habitatElement.clientWidth) *
        100,
      y:
        ((isopodBounds.top - habitatBounds.top - habitatElement.clientTop) /
          habitatElement.clientHeight) *
        100,
    }
  }

  useEffect(() => {
    if (foodTaskRevision === null || (state !== 'IDLE' && state !== 'WANDERING')) {
      return undefined
    }

    const frozenPosition = getRenderedPosition()
    setPosition(frozenPosition)
    setMovementDuration(0)
    setFrameIndex(0)
    setState('MOVING_TO_FOOD')

    return undefined
  }, [foodTaskRevision, state])

  useEffect(() => {
    if (
      foodTaskRevision !== null ||
      (state !== 'MOVING_TO_FOOD' && state !== 'AT_FOOD')
    ) {
      return
    }

    if (state === 'MOVING_TO_FOOD') {
      setPosition(getRenderedPosition())
    }

    setMovementDuration(0)
    setIdleDuration(ISOPOD_TIMING.postFoodIdleMs)
    setState('IDLE')
  }, [foodTaskRevision, state])

  useEffect(() => {
    if (state !== 'MOVING_TO_FOOD' || movementDuration !== 0) {
      return
    }

    const approachPosition =
      foodSlotIndex === null ? null : getFoodApproachPosition(foodSlotIndex)

    if (!approachPosition) {
      onFoodTaskCancel(id)
      setIdleDuration(ISOPOD_TIMING.postFoodIdleMs)
      setState('IDLE')
      return
    }

    const horizontalDistance = approachPosition.x - position.x

    if (Math.abs(horizontalDistance) > FACING_DEAD_ZONE) {
      setFacing(horizontalDistance < 0 ? 'left' : 'right')
    }

    setMovementDuration(getMovementDuration(position, approachPosition))
    setPosition(approachPosition)
  }, [foodSlotIndex, getFoodApproachPosition, id, movementDuration, onFoodTaskCancel, position, state])

  useEffect(() => {
    if (state === 'IDLE') {
      const idleTimer = window.setTimeout(() => {
        const destination = chooseDestination(position)
        const horizontalDistance = destination.x - position.x

        if (Math.abs(horizontalDistance) > FACING_DEAD_ZONE) {
          setFacing(horizontalDistance < 0 ? 'left' : 'right')
        }

        setMovementDuration(getMovementDuration(position, destination))
        setPosition(destination)
        setState('WANDERING')
      }, idleDuration)

      return () => window.clearTimeout(idleTimer)
    }

    if (state === 'WANDERING') {
      const movementTimer = window.setTimeout(() => {
        setIdleDuration(randomDuration(ISOPOD_TIMING.idleMinMs, ISOPOD_TIMING.idleMaxMs))
        setState('IDLE')
      }, movementDuration)

      return () => window.clearTimeout(movementTimer)
    }

    if (state === 'MOVING_TO_FOOD' && movementDuration > 0) {
      const foodMovementTimer = window.setTimeout(() => {
        setMovementDuration(0)
        onFoodTaskArrival(id)
        setState('AT_FOOD')
      }, movementDuration)

      return () => window.clearTimeout(foodMovementTimer)
    }

    return undefined
  }, [id, idleDuration, movementDuration, onFoodTaskArrival, position, state])

  useEffect(() => {
    if (state !== 'MOVING_TO_FOOD' && state !== 'AT_FOOD') {
      return undefined
    }

    const handleResize = () => {
      const approachPosition =
        foodSlotIndex === null ? null : getFoodApproachPosition(foodSlotIndex)
      if (approachPosition) {
        setPosition(approachPosition)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [foodSlotIndex, getFoodApproachPosition, state])

  useEffect(() => {
    switch (state) {
      case 'ROLLING': {
        const rollTimer = window.setTimeout(() => {
          if (frameIndex < rollFrames.length - 1) {
            setFrameIndex((currentFrame) => currentFrame + 1)
          } else {
          setState('ROLLED')
          }
        }, ISOPOD_TIMING.rollFrameMs)

        return () => window.clearTimeout(rollTimer)
      }

      case 'ROLLED': {
        const rolledTimer = window.setTimeout(() => {
          setState('UNROLLING')
        }, ISOPOD_TIMING.rolledHoldMs)

        return () => window.clearTimeout(rolledTimer)
      }

      case 'UNROLLING': {
        const unrollTimer = window.setTimeout(() => {
          if (frameIndex > 0) {
            setFrameIndex((currentFrame) => currentFrame - 1)
          } else {
            setIdleDuration(ISOPOD_TIMING.postRollIdleMs)
            setState('IDLE')
          }
        }, ISOPOD_TIMING.rollFrameMs)

        return () => window.clearTimeout(unrollTimer)
      }

      default:
        return undefined
    }
  }, [frameIndex, state])

  useEffect(() => {
    if (state !== 'IDLE' && state !== 'WANDERING' && state !== 'MOVING_TO_FOOD' && state !== 'AT_FOOD') {
      return undefined
    }

    setFrameIndex(0)
    const isIdleAnimation = state === 'IDLE' || state === 'AT_FOOD'
    const frameCount = isIdleAnimation ? idleFrames.length : walkFrames.length
    const frameDuration =
      isIdleAnimation ? ISOPOD_TIMING.idleFrameMs : ISOPOD_TIMING.walkFrameMs
    const animationTimer = window.setInterval(() => {
      setFrameIndex((currentFrame) => (currentFrame + 1) % frameCount)
    }, frameDuration)

    return () => window.clearInterval(animationTimer)
  }, [state])

  function handleRoll() {
    if (state === 'ROLLING' || state === 'ROLLED' || state === 'UNROLLING') {
      return
    }

    setPosition(getRenderedPosition())

    if (state === 'MOVING_TO_FOOD' || state === 'AT_FOOD') {
      onFoodTaskCancel(id)
    }

    setMovementDuration(0)
    setFrameIndex(0)
    setState('ROLLING')
  }

  function handleInfo(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onShowInfo(id)
  }

  let frames: readonly string[] = idleFrames

  if (state === 'WANDERING' || state === 'MOVING_TO_FOOD') {
    frames = walkFrames
  } else if (state === 'ROLLING' || state === 'ROLLED' || state === 'UNROLLING') {
    frames = rollFrames
  }

  const eatingDirection =
    foodSlotIndex === null ? null : FOOD_GATHERING_SLOTS[foodSlotIndex]
  const eatingMotionStyle = eatingDirection
    ? ({
        '--eating-bob-x': `${eatingMotion.distance * eatingDirection.eatingDirectionX}px`,
        '--eating-bob-y': `${eatingMotion.distance * eatingDirection.eatingDirectionY}px`,
        '--eating-bob-duration': `${eatingMotion.duration}ms`,
        '--eating-bob-delay': `-${eatingMotion.phaseOffset}ms`,
      } as CSSProperties)
    : undefined

  return (
    <div
      ref={actorRef}
      className={`isopod-actor isopod-actor--${state.toLowerCase()}`}
      data-facing={facing}
      data-isopod-id={id}
      data-species-id={species.speciesId}
      data-state={state}
      data-satiety={import.meta.env.DEV ? satiety : undefined}
      data-food-slot={foodSlotIndex ?? undefined}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transitionDuration:
          state === 'WANDERING' || state === 'MOVING_TO_FOOD'
            ? `${movementDuration}ms`
            : '0ms',
      }}
    >
      <button
        className="isopod"
        data-facing={facing}
        data-isopod-id={id}
        data-species-id={species.speciesId}
        data-state={state}
        data-satiety={import.meta.env.DEV ? satiety : undefined}
        style={eatingMotionStyle}
        onClick={handleRoll}
        type="button"
        aria-label={`讓 ${displayName} 縮成球`}
      >
        <img
          className="isopod__sprite"
          src={frames[frameIndex]}
          alt=""
          draggable="false"
        />
      </button>
      <div className="isopod-label-group">
        <span
          className="isopod-name-label"
          title={actorLabel}
          aria-hidden="true"
          onClick={(event) => event.stopPropagation()}
        >
          {actorLabel}
        </span>
        <button
          className="isopod-info-button"
          type="button"
          onClick={handleInfo}
          aria-label={`查看 ${displayName} 資訊`}
        >
          ⓘ
        </button>
      </div>
      {showFedHappy && (
        <img
          className="isopod-fed-happy"
          src={fedHappy}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{ animationDuration: `${FED_HAPPY_DURATION_MS}ms` }}
        />
      )}
    </div>
  )
}

export default Isopod
