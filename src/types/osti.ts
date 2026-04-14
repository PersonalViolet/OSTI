export const DIMENSION_ORDER = [
  'S1',
  'S2',
  'S3',
  'E1',
  'E2',
  'E3',
  'A1',
  'A2',
  'A3',
  'Ac1',
  'Ac2',
  'Ac3',
  'So1',
  'So2',
  'So3',
] as const

export type DimensionKey = (typeof DIMENSION_ORDER)[number]
export type Level = 'L' | 'M' | 'H'
export type OptionKey = 'A' | 'B' | 'C' | 'D'

export interface QuizOption {
  key: OptionKey
  text: string
}

export interface QuizQuestion {
  id: number
  prompt: string
  subtitle?: string
  dimension?: DimensionKey
  category: 'regular' | 'special'
  scienceHint?: string
  options: QuizOption[]
  scoreMap?: Partial<Record<OptionKey, number>>
}

export interface DimensionMeta {
  key: DimensionKey
  group: 'S' | 'E' | 'A' | 'Ac' | 'So'
  name: string
  scientificBasis: string
  levelDescriptions: Record<Level, string>
  practicalTips: Record<Level, string>
}

export interface PersonaProfile {
  code: string
  name: string
  osFamily: 'iOS' | 'Android' | 'Windows' | 'Linux' | 'macOS' | 'HarmonyOS' | 'ChromeOS' | 'BSD' | 'Special'
  pattern: string
  tagline: string
  description: string
  strengths: string[]
  blindSpots: string[]
  recommendations: string[]
  memeLine: string
}

export interface PersonaMatch {
  profile: PersonaProfile
  distance: number
  exactHits: number
  similarity: number
}

export interface ReliabilityReport {
  consistency: number
  interpretation: string
}

export interface QuizResult {
  dimensions: Record<DimensionKey, Level>
  dimensionScores: Record<DimensionKey, number>
  vector: number[]
  topMatches: PersonaMatch[]
  finalMatch: PersonaMatch
  fallbackMatch?: PersonaMatch
  specialCode: 'NONE' | 'DRUNK' | 'HHHH' | 'XIAOFENG'
  chaosIndex: number
  reliability: ReliabilityReport
  shareText: string
}
