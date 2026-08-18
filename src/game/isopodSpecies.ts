const speciesSpriteUrls = import.meta.glob<string>(
  '../assets/isopod/**/*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
)

export const ISOPOD_SPECIES_IDS = {
  PANDA_KING: 'PANDA_KING',
  LEMON_BLUE: 'LEMON_BLUE',
  MAGIC_POTION: 'MAGIC_POTION',
  SAKURA: 'SAKURA',
  AMBER: 'AMBER',
  GOLDEN: 'GOLDEN',
} as const

export type IsopodSpeciesId =
  (typeof ISOPOD_SPECIES_IDS)[keyof typeof ISOPOD_SPECIES_IDS]

export interface IsopodSpeciesDefinition {
  speciesId: IsopodSpeciesId
  chineseName: string
  englishName: string
  sprites: {
    idle: readonly [string, string]
    walk: readonly [string, string, string, string]
    roll: readonly [string, string, string, string]
  }
}

function resolveSpeciesSprite(folder: string, relativePath: string) {
  const assetPath = `../assets/isopod/${folder}/${relativePath}`
  const spriteUrl = speciesSpriteUrls[assetPath]

  if (!spriteUrl) {
    throw new Error(`Missing isopod species sprite: ${assetPath}`)
  }

  return spriteUrl
}

function createSpeciesDefinition(
  speciesId: IsopodSpeciesId,
  folder: string,
  chineseName: string,
  englishName: string,
): IsopodSpeciesDefinition {
  return {
    speciesId,
    chineseName,
    englishName,
    sprites: {
      idle: [
        resolveSpeciesSprite(folder, 'idle/idle_01.png'),
        resolveSpeciesSprite(folder, 'idle/idle_02.png'),
      ],
      walk: [
        resolveSpeciesSprite(folder, 'walk/walk_left_01.png'),
        resolveSpeciesSprite(folder, 'walk/walk_left_02.png'),
        resolveSpeciesSprite(folder, 'walk/walk_left_03.png'),
        resolveSpeciesSprite(folder, 'walk/walk_left_04.png'),
      ],
      roll: [
        resolveSpeciesSprite(folder, 'roll/roll_01.png'),
        resolveSpeciesSprite(folder, 'roll/roll_02.png'),
        resolveSpeciesSprite(folder, 'roll/roll_03.png'),
        resolveSpeciesSprite(folder, 'roll/roll_04.png'),
      ],
    },
  }
}

export const ISOPOD_SPECIES_REGISTRY: Readonly<
  Record<IsopodSpeciesId, IsopodSpeciesDefinition>
> = {
  PANDA_KING: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.PANDA_KING,
    'panda-king',
    '熊貓王',
    'Panda King',
  ),
  LEMON_BLUE: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.LEMON_BLUE,
    'lemon-blue',
    '檸檬藍',
    'Lemon Blue',
  ),
  MAGIC_POTION: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.MAGIC_POTION,
    'magic-potion',
    '魔藥',
    'Magic Potion',
  ),
  SAKURA: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.SAKURA,
    'sakura',
    '櫻花',
    'Sakura',
  ),
  AMBER: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.AMBER,
    'amber',
    '琥珀',
    'Amber',
  ),
  GOLDEN: createSpeciesDefinition(
    ISOPOD_SPECIES_IDS.GOLDEN,
    'golden',
    '黃金',
    'Golden',
  ),
}

export function getIsopodSpecies(speciesId: IsopodSpeciesId) {
  return ISOPOD_SPECIES_REGISTRY[speciesId]
}
