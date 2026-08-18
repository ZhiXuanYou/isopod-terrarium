export const ISOPOD_NAME_MAX_LENGTH = 12

export function resolveIsopodDisplayName(
  defaultName: string,
  customName: string | null,
) {
  return customName ?? defaultName
}

export function resolveIsopodActorLabel(
  defaultActorLabel: string,
  customName: string | null,
) {
  return customName ?? defaultActorLabel
}

export function validateIsopodName(value: string) {
  const trimmedName = value.trim()

  if (trimmedName.length === 0) {
    return { name: null, error: '名字不能是空白' } as const
  }

  if ([...trimmedName].length > ISOPOD_NAME_MAX_LENGTH) {
    return {
      name: null,
      error: `名字最多 ${ISOPOD_NAME_MAX_LENGTH} 個字`,
    } as const
  }

  return { name: trimmedName, error: null } as const
}
