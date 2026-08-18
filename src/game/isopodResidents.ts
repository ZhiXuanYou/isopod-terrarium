import {
  ISOPOD_INITIAL_POSITIONS,
  type Facing,
  type Position,
} from './isopodConfig'
import type { IsopodSpeciesId } from './isopodSpecies'

export interface IsopodResidentDefinition {
  id: string
  slotNumber: number
  speciesId: IsopodSpeciesId
  initialPosition: Position
  initialFacing?: Facing
}

export type ResidentSelectionSlots = readonly [
  IsopodSpeciesId | null,
  IsopodSpeciesId | null,
  IsopodSpeciesId | null,
]

export type CompleteResidentSelection = readonly [
  IsopodSpeciesId,
  IsopodSpeciesId,
  IsopodSpeciesId,
]

export const EMPTY_RESIDENT_SELECTION: ResidentSelectionSlots = [
  null,
  null,
  null,
]

export function isCompleteResidentSelection(
  selection: ResidentSelectionSlots,
): selection is CompleteResidentSelection {
  return selection.every((speciesId) => speciesId !== null)
}

export function createResidentRoster(
  selection: CompleteResidentSelection,
): readonly IsopodResidentDefinition[] {
  return selection.map((speciesId, index) => ({
    id: `resident-${index + 1}`,
    slotNumber: index + 1,
    speciesId,
    initialPosition: ISOPOD_INITIAL_POSITIONS[index],
    initialFacing: index === 1 ? 'right' : undefined,
  }))
}
