import type { PersonaProfile } from '@/types/osti'

type OsFamily = PersonaProfile['osFamily']

const personaIllustrationByFamily: Partial<Record<OsFamily, string>> = {
  iOS: new URL('../../assets/Apple.svg', import.meta.url).href,
  macOS: new URL('../../assets/Apple.svg', import.meta.url).href,
  Android: new URL('../../assets/Android.svg', import.meta.url).href,
  Windows: new URL('../../assets/Windows.svg', import.meta.url).href,
  Linux: new URL('../../assets/Linux.svg', import.meta.url).href,
}

export function getPersonaIllustration(osFamily: OsFamily): string | null {
  return personaIllustrationByFamily[osFamily] ?? null
}
