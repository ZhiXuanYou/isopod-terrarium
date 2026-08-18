import { useCallback, useEffect, useRef, useState } from 'react'
import foodBowl from '../assets/food/food_bowl.png'
import carrotSlice from '../assets/food/carrot_slice.png'
import carrotSlicesTwo from '../assets/food/carrot_slices_2.png'
import carrotSlicesThree from '../assets/food/carrot_slices_3.png'
import bauhiniaLeafOne from '../assets/food/bauhinia_leaf_01.png'
import bauhiniaLeafTwo from '../assets/food/bauhinia_leaf_02.png'
import bauhiniaLeafThree from '../assets/food/bauhinia_leaf_03.png'
import corkBark from '../assets/environment/wood/cork_bark_01.png'
import twig from '../assets/environment/wood/twig_01.png'
import mossOne from '../assets/environment/moss/moss_01.png'
import mossTwo from '../assets/environment/moss/moss_02.png'
import plantOne from '../assets/environment/plants/plant_01.png'
import plantTwo from '../assets/environment/plants/plant_02.png'
import plantThree from '../assets/environment/plants/plant_03.png'
import mossRock from '../assets/environment/stones/moss_rock_01.png'
import stoneOne from '../assets/environment/stones/stone_01.png'
import stoneTwo from '../assets/environment/stones/stone_02.png'
import stoneThree from '../assets/environment/stones/stone_03.png'
import leafOne from '../assets/environment/debris/leaf_01.png'
import leafTwo from '../assets/environment/debris/leaf_02.png'
import {
  FOOD_APPROACH,
  FOOD_GATHERING_SLOTS,
  ISOPOD_SAFE_BOUNDS,
  ISOPOD_TIMING,
  SATIETY,
  clampSatiety,
  createInitialSatiety,
  randomDuration,
  selectHungriestFoodCandidates,
  type IsopodState,
  type Position,
} from '../game/isopodConfig'
import {
  resolveIsopodActorLabel,
  resolveIsopodDisplayName,
} from '../game/isopodIdentity'
import type { IsopodResidentDefinition } from '../game/isopodResidents'
import { getIsopodSpecies } from '../game/isopodSpecies'
import Isopod from './Isopod'
import IsopodStatusPanel from './IsopodStatusPanel'
import '../styles/terrarium.css'

function getResidentDefaultName(resident: IsopodResidentDefinition) {
  return `${getIsopodSpecies(resident.speciesId).englishName} #${resident.slotNumber}`
}

export type FoodType = 'carrot' | 'leaf'
export type FoodSelection =
  | { type: null; count: 0 }
  | { type: FoodType; count: 1 | 2 | 3 }
export interface FoodState {
  food: FoodSelection
  revision: number
}

interface TerrariumProps {
  residents: readonly IsopodResidentDefinition[]
  foodState: FoodState
  onConsumeFood: (revision: number, type: FoodType, amount: number) => void
}

interface GroupParticipant {
  isopodId: string
  slotIndex: number
  arrived: boolean
}

interface FoodGroupEvent {
  id: number
  revision: number
  type: FoodType
  participants: GroupParticipant[]
  gatheringDeadline: number | null
}

interface PendingDiscovery {
  revision: number
  kind: 'initial' | 'subsequent'
}

function getFoodSprite(food: FoodSelection) {
  if (food.type === 'carrot') {
    return [carrotSlice, carrotSlicesTwo, carrotSlicesThree][food.count - 1]
  }

  if (food.type === 'leaf') {
    return [bauhiniaLeafOne, bauhiniaLeafTwo, bauhiniaLeafThree][food.count - 1]
  }

  return null
}

function createInitialSatieties(
  residents: readonly IsopodResidentDefinition[],
) {
  const diagnosticValues = import.meta.env.DEV
    ? new URLSearchParams(window.location.search)
        .get('satiety')
        ?.split(',')
        .map(Number)
    : undefined

  return Object.fromEntries(
    residents.map(({ id }, index) => [
      id,
      Number.isFinite(diagnosticValues?.[index])
        ? clampSatiety(diagnosticValues![index])
        : createInitialSatiety(),
    ]),
  ) as Record<string, number>
}

function Terrarium({ residents, foodState, onConsumeFood }: TerrariumProps) {
  const { food, revision } = foodState
  const habitatRef = useRef<HTMLDivElement>(null)
  const bowlRef = useRef<HTMLImageElement>(null)
  const [isopodStates, setIsopodStates] = useState(
    () => Object.fromEntries(
      residents.map(({ id }) => [id, 'IDLE']),
    ) as Record<string, IsopodState>,
  )
  const isopodStatesRef = useRef(isopodStates)
  const [satieties, setSatieties] = useState(() =>
    createInitialSatieties(residents),
  )
  const satietiesRef = useRef(satieties)
  const [groupEvent, setGroupEvent] = useState<FoodGroupEvent | null>(null)
  const groupEventRef = useRef<FoodGroupEvent | null>(null)
  const nextGroupEventIdRef = useRef(1)
  const [pendingDiscovery, setPendingDiscovery] = useState<PendingDiscovery | null>(null)
  const [selectedIsopodId, setSelectedIsopodId] = useState<string | null>(null)
  const [customNames, setCustomNames] = useState(
    () => Object.fromEntries(
      residents.map(({ id }) => [id, null]),
    ) as Record<string, string | null>,
  )
  const [fedHappySignals, setFedHappySignals] = useState(
    () => Object.fromEntries(
      residents.map(({ id }) => [id, 0]),
    ) as Record<string, number>,
  )
  const foodStateRef = useRef(foodState)
  const foodSprite = getFoodSprite(food)
  const selectedResident = residents.find(({ id }) => id === selectedIsopodId)
  const selectedSpecies = selectedResident
    ? getIsopodSpecies(selectedResident.speciesId)
    : null
  const selectedDisplayName = selectedResident
    ? resolveIsopodDisplayName(
        getResidentDefaultName(selectedResident),
        customNames[selectedResident.id],
      )
    : null

  foodStateRef.current = foodState

  const updateGroupEvent = useCallback((nextEvent: FoodGroupEvent | null) => {
    groupEventRef.current = nextEvent
    setGroupEvent(nextEvent)
  }, [])

  useEffect(() => {
    isopodStatesRef.current = isopodStates
  }, [isopodStates])

  useEffect(() => {
    satietiesRef.current = satieties
  }, [satieties])

  useEffect(() => {
    const decayTimer = window.setInterval(() => {
      setSatieties((current) => {
        const next = Object.fromEntries(
          residents.map(({ id }) => [
            id,
            clampSatiety(current[id] - SATIETY.decayAmount),
          ]),
        ) as Record<string, number>
        satietiesRef.current = next
        return next
      })
    }, SATIETY.decayIntervalMs)

    return () => window.clearInterval(decayTimer)
  }, [])

  useEffect(() => {
    updateGroupEvent(null)
    setPendingDiscovery(food.type ? { revision, kind: 'initial' } : null)
  }, [revision, updateGroupEvent])

  useEffect(() => {
    if (!pendingDiscovery || groupEvent) {
      return undefined
    }

    let discoveryTimer = 0

    const tryAssignment = () => {
      const currentFoodState = foodStateRef.current

      if (
        currentFoodState.revision !== pendingDiscovery.revision ||
        currentFoodState.food.type === null
      ) {
        setPendingDiscovery(null)
        return
      }

      const selectedIsopodIds = selectHungriestFoodCandidates(
        residents.map(({ id }) => ({
          id,
          state: isopodStatesRef.current[id],
          satiety: satietiesRef.current[id],
        })),
        currentFoodState.food.count,
      )

      if (selectedIsopodIds.length === 0) {
        discoveryTimer = window.setTimeout(
          tryAssignment,
          randomDuration(ISOPOD_TIMING.foodRetryMinMs, ISOPOD_TIMING.foodRetryMaxMs),
        )
        return
      }

      const nextGroupEvent: FoodGroupEvent = {
        id: nextGroupEventIdRef.current,
        revision: currentFoodState.revision,
        type: currentFoodState.food.type,
        participants: selectedIsopodIds.map((isopodId, slotIndex) => ({
          isopodId,
          slotIndex,
          arrived: false,
        })),
        gatheringDeadline: null,
      }
      nextGroupEventIdRef.current += 1
      updateGroupEvent(nextGroupEvent)
      setPendingDiscovery(null)
    }

    discoveryTimer = window.setTimeout(
      tryAssignment,
      pendingDiscovery.kind === 'initial'
        ? randomDuration(ISOPOD_TIMING.foodDiscoveryMinMs, ISOPOD_TIMING.foodDiscoveryMaxMs)
        : randomDuration(
            ISOPOD_TIMING.subsequentDiscoveryMinMs,
            ISOPOD_TIMING.subsequentDiscoveryMaxMs,
          ),
    )

    return () => window.clearTimeout(discoveryTimer)
  }, [groupEvent, pendingDiscovery, updateGroupEvent])

  const handleStateChange = useCallback((id: string, state: IsopodState) => {
    setIsopodStates((current) =>
      current[id] === state ? current : { ...current, [id]: state },
    )
  }, [])

  const handleRename = useCallback((id: string, customName: string) => {
    setCustomNames((current) => ({ ...current, [id]: customName }))
  }, [])

  const handleFoodTaskArrival = useCallback(
    (id: string) => {
      const currentEvent = groupEventRef.current

      if (!currentEvent) {
        return
      }

      if (
        !currentEvent.participants.some(
          ({ isopodId }) => isopodId === id,
        )
      ) {
        return
      }

      const participants = currentEvent.participants.map((participant) =>
        participant.isopodId === id
          ? { ...participant, arrived: true }
          : participant,
      )
      const allArrived = participants.every(({ arrived }) => arrived)
      const nextEvent = {
        ...currentEvent,
        participants,
        gatheringDeadline:
          allArrived && currentEvent.gatheringDeadline === null
            ? Date.now() +
              randomDuration(
                ISOPOD_TIMING.groupGatheringMinMs,
                ISOPOD_TIMING.groupGatheringMaxMs,
              )
            : currentEvent.gatheringDeadline,
      }
      updateGroupEvent(nextEvent)
    },
    [updateGroupEvent],
  )

  const handleFoodTaskCancel = useCallback(
    (id: string) => {
      const currentEvent = groupEventRef.current

      if (!currentEvent) {
        return
      }

      const participants = currentEvent.participants.filter(
        ({ isopodId }) => isopodId !== id,
      )

      if (participants.length === currentEvent.participants.length) {
        return
      }

      const currentFoodState = foodStateRef.current
      const eventIsCurrent =
        currentFoodState.revision === currentEvent.revision &&
        currentFoodState.food.type === currentEvent.type

      if (participants.length === 0) {
        updateGroupEvent(null)
        if (eventIsCurrent && currentFoodState.food.count > 0) {
          setPendingDiscovery({
            revision: currentEvent.revision,
            kind: 'subsequent',
          })
        }
        return
      }

      const allArrived = participants.every(({ arrived }) => arrived)
      updateGroupEvent({
        ...currentEvent,
        participants,
        gatheringDeadline:
          allArrived && currentEvent.gatheringDeadline === null
            ? Date.now() +
              randomDuration(
                ISOPOD_TIMING.groupGatheringMinMs,
                ISOPOD_TIMING.groupGatheringMaxMs,
              )
            : currentEvent.gatheringDeadline,
      })
    },
    [updateGroupEvent],
  )

  useEffect(() => {
    if (!groupEvent?.gatheringDeadline) {
      return undefined
    }

    const eventId = groupEvent.id
    const gatheringTimer = window.setTimeout(() => {
      const currentEvent = groupEventRef.current
      const currentFoodState = foodStateRef.current

      if (
        !currentEvent ||
        currentEvent.id !== eventId ||
        currentFoodState.revision !== currentEvent.revision ||
        currentFoodState.food.type !== currentEvent.type
      ) {
        return
      }

      const consumerIds = currentEvent.participants
        .slice(0, currentFoodState.food.count)
        .map(({ isopodId }) => isopodId)
      const servingsAfterGroup = currentFoodState.food.count - consumerIds.length

      updateGroupEvent(null)

      if (consumerIds.length > 0) {
        onConsumeFood(currentEvent.revision, currentEvent.type, consumerIds.length)
        setSatieties((current) => {
          const next = { ...current }
          consumerIds.forEach((id) => {
            next[id] = clampSatiety(current[id] + SATIETY.gainFromFood)
          })
          satietiesRef.current = next
          return next
        })
        setFedHappySignals((current) => {
          const next = { ...current }
          consumerIds.forEach((id) => {
            next[id] = current[id] + 1
          })
          return next
        })
      }

      if (servingsAfterGroup > 0) {
        setPendingDiscovery({
          revision: currentEvent.revision,
          kind: 'subsequent',
        })
      }
    }, Math.max(0, groupEvent.gatheringDeadline - Date.now()))

    return () => window.clearTimeout(gatheringTimer)
  }, [groupEvent, onConsumeFood, updateGroupEvent])

  const getFoodApproachPosition = useCallback((slotIndex: number): Position | null => {
    const habitat = habitatRef.current
    const bowl = bowlRef.current

    if (!habitat || !bowl || habitat.clientWidth === 0 || habitat.clientHeight === 0) {
      return null
    }

    const habitatBounds = habitat.getBoundingClientRect()
    const bowlBounds = bowl.getBoundingClientRect()
    const spriteWidthPercent = window.matchMedia('(max-width: 38rem)').matches ? 18 : 15
    const bowlLeftPercent = ((bowlBounds.left - habitatBounds.left) / habitat.clientWidth) * 100
    const bowlTopPercent = ((bowlBounds.top - habitatBounds.top) / habitat.clientHeight) * 100
    const bowlWidthPercent = (bowlBounds.width / habitat.clientWidth) * 100
    const bowlHeightPercent = (bowlBounds.height / habitat.clientHeight) * 100
    const visibleBowlLeftPercent =
      bowlLeftPercent + bowlWidthPercent * FOOD_APPROACH.visibleBowlLeftInset
    const slot = FOOD_GATHERING_SLOTS[slotIndex]

    if (!slot) {
      return null
    }

    return {
      x: Math.min(
        ISOPOD_SAFE_BOUNDS.maxX,
        Math.max(
          ISOPOD_SAFE_BOUNDS.minX,
          visibleBowlLeftPercent +
            bowlWidthPercent * slot.bowlXOffset -
            spriteWidthPercent * slot.spriteXOffset,
        ),
      ),
      y: Math.min(
        ISOPOD_SAFE_BOUNDS.maxY,
        Math.max(
          ISOPOD_SAFE_BOUNDS.minY,
          bowlTopPercent + bowlHeightPercent * slot.bowlYOffset,
        ),
      ),
    }
  }, [])

  return (
    <>
    <section className="terrarium" aria-label="鼠婦生態飼養箱">
      <div className="terrarium__back-wall" aria-hidden="true" />
      <div ref={habitatRef} className="terrarium__habitat">
        <div className="substrate" aria-hidden="true" />

        <div className="environment-layer environment-layer--back" aria-hidden="true">
          <img className="environment-sprite plant-sprite plant-sprite--one" src={plantOne} alt="" />
          <img className="environment-sprite plant-sprite plant-sprite--two" src={plantTwo} alt="" />
          <img className="environment-sprite plant-sprite plant-sprite--three" src={plantThree} alt="" />
          <img className="environment-sprite plant-sprite plant-sprite--four" src={plantThree} alt="" />

          <img className="environment-sprite moss-sprite moss-sprite--one" src={mossOne} alt="" />
          <img className="environment-sprite moss-sprite moss-sprite--two" src={mossTwo} alt="" />
          <img className="environment-sprite moss-sprite moss-sprite--three" src={mossOne} alt="" />
          <img className="environment-sprite moss-sprite moss-sprite--four" src={mossTwo} alt="" />
          <img className="environment-sprite moss-sprite moss-sprite--five" src={mossOne} alt="" />

          <img className="environment-sprite cork-bark-sprite" src={corkBark} alt="" />
          <img className="environment-sprite twig-sprite" src={twig} alt="" />

          <img className="environment-sprite stone-sprite stone-sprite--moss" src={mossRock} alt="" />
          <img className="environment-sprite stone-sprite stone-sprite--one" src={stoneOne} alt="" />
          <img className="environment-sprite stone-sprite stone-sprite--two" src={stoneTwo} alt="" />
          <img className="environment-sprite stone-sprite stone-sprite--three" src={stoneThree} alt="" />
          <img className="environment-sprite stone-sprite stone-sprite--four" src={stoneThree} alt="" />

          <img className="environment-sprite leaf-sprite leaf-sprite--one" src={leafOne} alt="" />
          <img className="environment-sprite leaf-sprite leaf-sprite--two" src={leafTwo} alt="" />
          <img className="environment-sprite leaf-sprite leaf-sprite--three" src={leafOne} alt="" />
          <img className="environment-sprite leaf-sprite leaf-sprite--four" src={leafTwo} alt="" />
        </div>

        <div className="food-station">
          <img
            ref={bowlRef}
            className="food-bowl"
            src={foodBowl}
            alt={
              food.type === 'carrot'
                ? `裝有 ${food.count} 份胡蘿蔔的食盆`
                : food.type === 'leaf'
                  ? `裝有 ${food.count} 份羊蹄甲葉的食盆`
                  : '空的食盆'
            }
          />
          {foodSprite && food.type && (
            <img
              className={`food-item food-item--${food.type}-${food.count}`}
              src={foodSprite}
              alt={food.type === 'carrot' ? `${food.count} 份胡蘿蔔片` : `${food.count} 份羊蹄甲葉`}
            />
          )}
        </div>

        {residents.map((resident) => {
          const species = getIsopodSpecies(resident.speciesId)

          return (
          <Isopod
            key={resident.id}
            id={resident.id}
            species={species}
            initialPosition={resident.initialPosition}
            initialFacing={resident.initialFacing}
            satiety={satieties[resident.id]}
            displayName={resolveIsopodDisplayName(
              getResidentDefaultName(resident),
              customNames[resident.id],
            )}
            actorLabel={resolveIsopodActorLabel(
              `#${resident.slotNumber}`,
              customNames[resident.id],
            )}
            fedHappySignal={fedHappySignals[resident.id]}
            onShowInfo={setSelectedIsopodId}
            foodTaskRevision={
              groupEvent?.participants.some(
                ({ isopodId }) => isopodId === resident.id,
              )
                ? groupEvent.revision
                : null
            }
            foodSlotIndex={
              groupEvent?.participants.find(
                ({ isopodId }) => isopodId === resident.id,
              )?.slotIndex ?? null
            }
            getFoodApproachPosition={getFoodApproachPosition}
            onStateChange={handleStateChange}
            onFoodTaskArrival={handleFoodTaskArrival}
            onFoodTaskCancel={handleFoodTaskCancel}
          />
          )
        })}

        <div className="environment-layer environment-layer--front" aria-hidden="true">
          <img className="environment-sprite leaf-sprite leaf-sprite--five" src={leafOne} alt="" />
          <img className="environment-sprite leaf-sprite leaf-sprite--six" src={leafTwo} alt="" />
        </div>

        <div className="terrarium__front-glass" aria-hidden="true" />
      </div>
    </section>
    {selectedResident && selectedSpecies && selectedDisplayName && (
      <IsopodStatusPanel
        key={selectedResident.id}
        displayName={selectedDisplayName}
        speciesChineseName={selectedSpecies.chineseName}
        speciesEnglishName={selectedSpecies.englishName}
        customName={customNames[selectedResident.id]}
        satiety={satieties[selectedResident.id]}
        state={isopodStates[selectedResident.id]}
        onRename={(customName) => handleRename(selectedResident.id, customName)}
        onClose={() => setSelectedIsopodId(null)}
      />
    )}
    </>
  )
}

export default Terrarium
