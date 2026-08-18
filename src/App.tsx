import './styles/app.css'
import { useCallback, useState } from 'react'
import Terrarium, { type FoodState, type FoodType } from './components/Terrarium'
import ResidentSelectionScreen from './components/ResidentSelectionScreen'
import {
  EMPTY_RESIDENT_SELECTION,
  createResidentRoster,
  isCompleteResidentSelection,
  type IsopodResidentDefinition,
  type ResidentSelectionSlots,
} from './game/isopodResidents'
import type { IsopodSpeciesId } from './game/isopodSpecies'

function App() {
  const [residentSelection, setResidentSelection] =
    useState<ResidentSelectionSlots>(EMPTY_RESIDENT_SELECTION)
  const [residents, setResidents] = useState<
    readonly IsopodResidentDefinition[] | null
  >(null)
  const [foodState, setFoodState] = useState<FoodState>({
    food: { type: null, count: 0 },
    revision: 0,
  })

  function addSelectedSpecies(speciesId: IsopodSpeciesId) {
    setResidentSelection((current) => {
      const emptySlotIndex = current.indexOf(null)

      if (emptySlotIndex === -1) {
        return current
      }

      const next = [...current] as [
        IsopodSpeciesId | null,
        IsopodSpeciesId | null,
        IsopodSpeciesId | null,
      ]
      next[emptySlotIndex] = speciesId
      return next
    })
  }

  function clearSelectedSlot(slotIndex: number) {
    setResidentSelection((current) => {
      const next = [...current] as [
        IsopodSpeciesId | null,
        IsopodSpeciesId | null,
        IsopodSpeciesId | null,
      ]
      next[slotIndex] = null
      return next
    })
  }

  function startCare() {
    if (!isCompleteResidentSelection(residentSelection)) {
      return
    }

    setResidents(createResidentRoster(residentSelection))
  }

  function addFood(type: FoodType) {
    setFoodState((current) => {
      if (current.food.type !== type) {
        return {
          food: { type, count: 1 },
          revision: current.revision + 1,
        }
      }

      return {
        ...current,
        food: {
          type,
          count: Math.min(current.food.count + 1, 3) as 1 | 2 | 3,
        },
      }
    })
  }

  const consumeFood = useCallback((revision: number, type: FoodType, amount: number) => {
    setFoodState((current) => {
      if (current.revision !== revision || current.food.type !== type) {
        return current
      }

      const nextCount = Math.max(0, current.food.count - amount)

      if (nextCount === 0) {
        return { food: { type: null, count: 0 }, revision: current.revision }
      }

      return {
        ...current,
        food: { type, count: nextCount as 1 | 2 | 3 },
      }
    })
  }, [])

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">Isopod Habitat</p>
        <h1>Isopod Terrarium</h1>
        <p className="intro">A quiet little world beneath the leaves.</p>
      </header>

      {residents ? (
        <>
          <Terrarium
            residents={residents}
            foodState={foodState}
            onConsumeFood={consumeFood}
          />

          <div className="terrarium-controls">
            <button
              className="feed-button"
              type="button"
              onClick={() => addFood('carrot')}
            >
              <span aria-hidden="true">🥕</span> 餵紅蘿蔔
            </button>
            <button
              className="feed-button"
              type="button"
              onClick={() => addFood('leaf')}
            >
              <span aria-hidden="true">🍃</span> 餵葉子
            </button>
          </div>
        </>
      ) : (
        <ResidentSelectionScreen
          selection={residentSelection}
          onAddSpecies={addSelectedSpecies}
          onClearSlot={clearSelectedSlot}
          onStart={startCare}
        />
      )}
    </main>
  )
}

export default App
