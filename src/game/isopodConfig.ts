export type IsopodState =
  | 'IDLE'
  | 'WANDERING'
  | 'ROLLING'
  | 'ROLLED'
  | 'UNROLLING'
  | 'MOVING_TO_FOOD'
  | 'AT_FOOD'

export type Facing = 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export const ISOPOD_INITIAL_POSITIONS: readonly Position[] = [
  { x: 16, y: 23 },
  { x: 74, y: 55 },
  { x: 41, y: 67 },
]

export const ISOPOD_SAFE_BOUNDS = {
  minX: 4,
  maxX: 78,
  minY: 4,
  maxY: 68,
} as const

export const ISOPOD_TIMING = {
  initialIdleMinMs: 500,
  initialIdleMaxMs: 3_000,
  idleMinMs: 2_000,
  idleMaxMs: 6_000,
  idleFrameMs: 650,
  walkFrameMs: 180,
  movementMinMs: 3_000,
  movementMaxMs: 8_000,
  movementMsPerDistanceUnit: 135,
  rollFrameMs: 150,
  rolledHoldMs: 3_000,
  postRollIdleMs: 1_200,
  foodDiscoveryMinMs: 1_000,
  foodDiscoveryMaxMs: 3_000,
  foodRetryMinMs: 500,
  foodRetryMaxMs: 1_000,
  subsequentDiscoveryMinMs: 8_000,
  subsequentDiscoveryMaxMs: 15_000,
  groupGatheringMinMs: 6_000,
  groupGatheringMaxMs: 10_000,
  postFoodIdleMs: 1_200,
} as const

export const SATIETY = {
  min: 0,
  max: 100,
  initialMin: 60,
  initialMax: 90,
  decayIntervalMs: 10_000,
  decayAmount: 1,
  hungryThreshold: 70,
  gainFromFood: 30,
} as const

export const FED_HAPPY_DURATION_MS = 1_800

export const EATING_BOB_INTERVAL_MIN_MS = 300
export const EATING_BOB_INTERVAL_MAX_MS = 500
export const EATING_BOB_DISTANCE_MIN_PX = 2
export const EATING_BOB_DISTANCE_MAX_PX = 4

export const MIN_DESTINATION_DISTANCE = 12
export const FACING_DEAD_ZONE = 1.5

export const FOOD_APPROACH = {
  visibleBowlLeftInset: 0.26,
} as const

export const FOOD_GATHERING_SLOTS = [
  {
    bowlXOffset: 0,
    spriteXOffset: 0.9,
    bowlYOffset: 0.15,
    eatingDirectionX: 1,
    eatingDirectionY: -0.15,
  },
  {
    bowlXOffset: 0.25,
    spriteXOffset: 0.5,
    bowlYOffset: 0.32,
    eatingDirectionX: 0,
    eatingDirectionY: -1,
  },
  {
    bowlXOffset: 0.55,
    spriteXOffset: 0.1,
    bowlYOffset: 0.15,
    eatingDirectionX: -1,
    eatingDirectionY: -0.15,
  },
] as const

export interface FoodCandidate {
  id: string
  state: IsopodState
  satiety: number
}

export function clampSatiety(value: number) {
  return Math.min(SATIETY.max, Math.max(SATIETY.min, value))
}

export function createInitialSatiety() {
  return Math.round(randomBetween(SATIETY.initialMin, SATIETY.initialMax))
}

export function isEligibleForFood(state: IsopodState, satiety: number) {
  return (
    (state === 'IDLE' || state === 'WANDERING') &&
    satiety <= SATIETY.hungryThreshold
  )
}

export function selectHungriestFoodCandidate(candidates: readonly FoodCandidate[]) {
  return selectHungriestFoodCandidates(candidates, 1)[0] ?? null
}

export function selectHungriestFoodCandidates(
  candidates: readonly FoodCandidate[],
  limit: number,
) {
  return candidates
    .filter(({ state, satiety }) => isEligibleForFood(state, satiety))
    .map((candidate) => ({ candidate, tieBreaker: Math.random() }))
    .sort(
      (left, right) =>
        left.candidate.satiety - right.candidate.satiety ||
        left.tieBreaker - right.tieBreaker,
    )
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate.id)
}

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function randomDuration(min: number, max: number) {
  return Math.round(randomBetween(min, max))
}

export function chooseDestination(current: Position): Position {
  let destination = current

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = {
      x: randomBetween(ISOPOD_SAFE_BOUNDS.minX, ISOPOD_SAFE_BOUNDS.maxX),
      y: randomBetween(ISOPOD_SAFE_BOUNDS.minY, ISOPOD_SAFE_BOUNDS.maxY),
    }

    if (getMovementDistance(current, candidate) >= MIN_DESTINATION_DISTANCE) {
      return candidate
    }

    destination = candidate
  }

  return destination
}

export function getMovementDuration(from: Position, to: Position) {
  const distance = getMovementDistance(from, to)
  const duration = distance * ISOPOD_TIMING.movementMsPerDistanceUnit

  return Math.round(
    Math.min(ISOPOD_TIMING.movementMaxMs, Math.max(ISOPOD_TIMING.movementMinMs, duration)),
  )
}

function getMovementDistance(from: Position, to: Position) {
  const deltaX = to.x - from.x
  const deltaY = (to.y - from.y) * 0.6

  return Math.hypot(deltaX, deltaY)
}
