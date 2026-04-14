import {
  DIMENSION_ORDER,
  type DimensionKey,
  type Level,
  type OptionKey,
  type PersonaMatch,
  type PersonaProfile,
  type QuizQuestion,
  type QuizResult,
  type ReliabilityReport,
} from '@/types/osti'
import {
  DIMENSION_QUESTION_MAP,
  PERSONA_LIBRARY,
  QUESTION_BANK,
  SCORING_CONFIG,
  SPECIAL_PERSONAS,
} from '@/data/osti-data'

const QUESTION_BY_ID = new Map<number, QuizQuestion>(QUESTION_BANK.map((question) => [question.id, question]))
const REGULAR_QUESTION_IDS = QUESTION_BANK.filter((question) => question.category === 'regular').map((question) => question.id)
const DIMENSION_MAX_DISTANCE = DIMENSION_ORDER.length * 2

const LEVEL_TO_NUMBER: Record<Level, number> = {
  L: 1,
  M: 2,
  H: 3,
}

function assertQuestion(id: number): QuizQuestion {
  const question = QUESTION_BY_ID.get(id)

  if (!question) {
    throw new Error(`Question ${id} not found.`)
  }

  return question
}

function scoreOption(question: QuizQuestion, answer: OptionKey): number {
  if (question.category !== 'regular' || !question.dimension) {
    return 0
  }

  const defaultScore = SCORING_CONFIG.defaultScoreMap[answer as 'A' | 'B' | 'C']
  const customScore = question.scoreMap?.[answer]

  if (typeof customScore === 'number') {
    return customScore
  }

  return typeof defaultScore === 'number' ? defaultScore : 0
}

function scoreToLevel(score: number): Level {
  if (score <= 3) {
    return 'L'
  }

  if (score === 4) {
    return 'M'
  }

  return 'H'
}

function parsePattern(pattern: string): Level[] {
  const raw = pattern.replaceAll('-', '').toUpperCase().split('')

  if (raw.length !== DIMENSION_ORDER.length) {
    throw new Error(`Invalid pattern length: ${pattern}`)
  }

  return raw.map((char) => {
    if (char !== 'L' && char !== 'M' && char !== 'H') {
      throw new Error(`Invalid pattern token ${char} in ${pattern}`)
    }

    return char
  })
}

function toVectorFromLevels(levels: Record<DimensionKey, Level>): number[] {
  return DIMENSION_ORDER.map((dimension) => LEVEL_TO_NUMBER[levels[dimension]])
}

function toVectorFromPattern(pattern: string): number[] {
  return parsePattern(pattern).map((level) => LEVEL_TO_NUMBER[level])
}

function evaluatePersona(profile: PersonaProfile, userVector: number[]): PersonaMatch {
  const targetVector = toVectorFromPattern(profile.pattern)

  let distance = 0
  let exactHits = 0

  targetVector.forEach((targetValue, index) => {
    const userValue = userVector[index] ?? 2

    distance += Math.abs(userValue - targetValue)

    if (userValue === targetValue) {
      exactHits += 1
    }
  })

  const similarity = Math.max(0, Math.round((1 - distance / DIMENSION_MAX_DISTANCE) * 100))

  return {
    profile,
    distance,
    exactHits,
    similarity,
  }
}

function computeDimensions(answers: Partial<Record<number, OptionKey>>): {
  levels: Record<DimensionKey, Level>
  scores: Record<DimensionKey, number>
} {
  const levels = {} as Record<DimensionKey, Level>
  const scores = {} as Record<DimensionKey, number>

  DIMENSION_ORDER.forEach((dimension) => {
    const [q1, q2] = DIMENSION_QUESTION_MAP[dimension]
    const questionA = assertQuestion(q1)
    const questionB = assertQuestion(q2)
    const answerA = answers[q1]
    const answerB = answers[q2]

    if (!answerA || !answerB) {
      throw new Error(`Incomplete answers for ${dimension}.`)
    }

    const score = scoreOption(questionA, answerA) + scoreOption(questionB, answerB)

    scores[dimension] = score
    levels[dimension] = scoreToLevel(score)
  })

  return { levels, scores }
}

function buildReliabilityReport(answers: Partial<Record<number, OptionKey>>): ReliabilityReport {
  let totalGap = 0

  DIMENSION_ORDER.forEach((dimension) => {
    const [q1, q2] = DIMENSION_QUESTION_MAP[dimension]
    const answerA = answers[q1]
    const answerB = answers[q2]

    if (!answerA || !answerB) {
      return
    }

    const scoreA = scoreOption(assertQuestion(q1), answerA)
    const scoreB = scoreOption(assertQuestion(q2), answerB)

    totalGap += Math.abs(scoreA - scoreB)
  })

  const consistency = Math.max(0, Math.round((1 - totalGap / DIMENSION_MAX_DISTANCE) * 100))

  let interpretation = '回答一致性较高，结果稳定性较好。'

  if (consistency < 55) {
    interpretation = '回答摇摆较大，建议隔几天重测一次。'
  } else if (consistency < 75) {
    interpretation = '回答有一定波动，结果可作为当前状态参考。'
  }

  return { consistency, interpretation }
}

function buildChaosIndex(levels: Record<DimensionKey, Level>): number {
  const vector = toVectorFromLevels(levels)
  const deviation = vector.reduce((sum, value) => sum + Math.abs(value - 2), 0)

  return Math.round((deviation / DIMENSION_ORDER.length) * 100)
}

function createSpecialMatch(
  profile: PersonaProfile,
  userVector: number[],
  forcedSimilarity: number,
): PersonaMatch {
  const baseline = toVectorFromPattern(profile.pattern)
  const distance = baseline.reduce(
    (sum, value, index) => sum + Math.abs(value - (userVector[index] ?? 2)),
    0,
  )

  return {
    profile,
    distance,
    exactHits: baseline.filter((value, index) => value === userVector[index]).length,
    similarity: forcedSimilarity,
  }
}

function buildShareText(result: QuizResult): string {
  const top = result.finalMatch
  const displayName =
    top.profile.name === top.profile.osFamily
      ? top.profile.name
      : `${top.profile.name}（${top.profile.osFamily}）`

  return `我在 OSTI 测出了 ${displayName}！匹配度 ${top.similarity}% ，抽象指数 ${result.chaosIndex}。系统气质：${top.profile.tagline}`
}

export function getQuestionFlow(answers: Partial<Record<number, OptionKey>>): QuizQuestion[] {
  const flow = QUESTION_BANK.filter((question) => question.id <= 31 || question.id === 33)

  if (answers[31] === 'C') {
    flow.push(assertQuestion(32))
  }

  return flow.sort((a, b) => a.id - b.id)
}

export function getQuestionById(id: number): QuizQuestion {
  return assertQuestion(id)
}

export function calculateQuizResult(answers: Partial<Record<number, OptionKey>>): QuizResult {
  const hasMissingRegularAnswer = REGULAR_QUESTION_IDS.some((questionId) => !answers[questionId])

  if (hasMissingRegularAnswer) {
    throw new Error('Regular questions are not fully answered.')
  }

  const { levels, scores } = computeDimensions(answers)
  const vector = toVectorFromLevels(levels)
  const topMatches = PERSONA_LIBRARY.map((profile) => evaluatePersona(profile, vector)).sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance
    }

    if (a.exactHits !== b.exactHits) {
      return b.exactHits - a.exactHits
    }

    return b.similarity - a.similarity
  })

  const bestMatch = topMatches[0]

  if (!bestMatch) {
    throw new Error('No persona profile available.')
  }

  let finalMatch = bestMatch
  let fallbackMatch: PersonaMatch | undefined
  let specialCode: QuizResult['specialCode'] = 'NONE'

  if (answers[33] === 'A') {
    specialCode = 'XIAOFENG'
    fallbackMatch = bestMatch
    finalMatch = createSpecialMatch(SPECIAL_PERSONAS.XIAOFENG, vector, 100)
  } else if (answers[31] === 'C' && answers[32] === 'B') {
    specialCode = 'DRUNK'
    fallbackMatch = bestMatch
    finalMatch = createSpecialMatch(SPECIAL_PERSONAS.DRUNK, vector, 100)
  } else if (bestMatch.similarity < SCORING_CONFIG.fallbackSimilarityThreshold) {
    specialCode = 'HHHH'
    fallbackMatch = bestMatch
    finalMatch = createSpecialMatch(SPECIAL_PERSONAS.HHHH, vector, 88)
  }

  const result: QuizResult = {
    dimensions: levels,
    dimensionScores: scores,
    vector,
    topMatches,
    finalMatch,
    fallbackMatch,
    specialCode,
    chaosIndex: buildChaosIndex(levels),
    reliability: buildReliabilityReport(answers),
    shareText: '',
  }

  result.shareText = buildShareText(result)

  return result
}
