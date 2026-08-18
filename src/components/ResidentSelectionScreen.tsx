import {
  ISOPOD_SPECIES_REGISTRY,
  getIsopodSpecies,
  type IsopodSpeciesId,
} from '../game/isopodSpecies'
import {
  isCompleteResidentSelection,
  type ResidentSelectionSlots,
} from '../game/isopodResidents'
import '../styles/resident-selection.css'

interface ResidentSelectionScreenProps {
  selection: ResidentSelectionSlots
  onAddSpecies: (speciesId: IsopodSpeciesId) => void
  onClearSlot: (slotIndex: number) => void
  onStart: () => void
}

function ResidentSelectionScreen({
  selection,
  onAddSpecies,
  onClearSlot,
  onStart,
}: ResidentSelectionScreenProps) {
  const speciesDefinitions = Object.values(ISOPOD_SPECIES_REGISTRY)
  const selectionComplete = isCompleteResidentSelection(selection)

  return (
    <section className="resident-selection" aria-labelledby="resident-selection-title">
      <div className="resident-selection__heading">
        <p className="resident-selection__eyebrow">建立你的生態箱</p>
        <h2 id="resident-selection-title">選擇你的 3 隻鼠婦</h2>
        <p>依序填滿三個居民位置；相同品種可以重複選擇。</p>
      </div>

      <div className="species-grid" aria-label="可選鼠婦品種">
        {speciesDefinitions.map((species) => {
          const selectedCount = selection.filter(
            (speciesId) => speciesId === species.speciesId,
          ).length

          return (
            <button
              key={species.speciesId}
              className="species-card"
              type="button"
              onClick={() => onAddSpecies(species.speciesId)}
              disabled={selectionComplete}
              aria-label={`選擇 ${species.chineseName} ${species.englishName}`}
            >
              {selectedCount > 0 && (
                <span className="species-card__count" aria-label={`已選 ${selectedCount} 隻`}>
                  ×{selectedCount}
                </span>
              )}
              <span className="species-card__preview">
                <img
                  src={species.sprites.idle[0]}
                  alt=""
                  draggable="false"
                />
              </span>
              <strong>{species.chineseName}</strong>
              <span>{species.englishName}</span>
            </button>
          )
        })}
      </div>

      <div className="resident-slots" aria-label="已選擇的居民位置">
        {selection.map((speciesId, slotIndex) => {
          const species = speciesId ? getIsopodSpecies(speciesId) : null

          return (
            <article
              key={slotIndex}
              className={`resident-slot${species ? ' resident-slot--filled' : ''}`}
            >
              <span className="resident-slot__number">{slotIndex + 1}</span>
              {species ? (
                <>
                  <img src={species.sprites.idle[0]} alt="" draggable="false" />
                  <div>
                    <strong>{species.chineseName}</strong>
                    <span>{species.englishName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClearSlot(slotIndex)}
                    aria-label={`移除 Slot ${slotIndex + 1} 的 ${species.englishName}`}
                  >
                    移除
                  </button>
                </>
              ) : (
                <p>Slot {slotIndex + 1} 尚未選擇</p>
              )}
            </article>
          )
        })}
      </div>

      <button
        className="start-care-button"
        type="button"
        onClick={onStart}
        disabled={!selectionComplete}
      >
        開始飼養
      </button>
    </section>
  )
}

export default ResidentSelectionScreen
