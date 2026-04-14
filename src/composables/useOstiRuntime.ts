import { computed, reactive, ref } from 'vue'
import QRCode from 'qrcode'

import { DIMENSION_META } from '@/data/osti-data'
import { getPersonaIllustration } from '@/lib/persona-illustration'
import { calculateQuizResult, getQuestionFlow } from '@/lib/osti-engine'
import {
  DIMENSION_ORDER,
  type Level,
  type OptionKey,
  type PersonaProfile,
  type QuizResult,
} from '@/types/osti'

type OsFamily = PersonaProfile['osFamily']

type OstiRuntime = ReturnType<typeof createOstiRuntime>

let runtime: OstiRuntime | null = null

function createOstiRuntime() {
  const osFamiliesForDisplay: OsFamily[] = [
    'iOS',
    'Android',
    'Windows',
    'Linux',
    'macOS',
    'HarmonyOS',
    'ChromeOS',
    'BSD',
  ]

  const osLogoSlugMap: Record<OsFamily, string> = {
    iOS: 'apple',
    Android: 'android',
    Windows: 'windows',
    Linux: 'linux',
    macOS: 'apple',
    HarmonyOS: 'harmonyos',
    ChromeOS: 'googlechrome',
    BSD: 'freebsd',
    Special: '',
  }

  const osLogoFallbackMap: Record<OsFamily, string> = {
    iOS: 'iOS',
    Android: 'AND',
    Windows: 'WIN',
    Linux: 'LNX',
    macOS: 'MAC',
    HarmonyOS: 'HOS',
    ChromeOS: 'CHR',
    BSD: 'BSD',
    Special: 'SP',
  }

  const currentIndex = ref(0)
  const answers = reactive<Partial<Record<number, OptionKey>>>({})
  const result = ref<QuizResult | null>(null)
  const logoLoadFailed = reactive<Record<OsFamily, boolean>>({
    iOS: false,
    Android: false,
    Windows: false,
    Linux: false,
    macOS: false,
    HarmonyOS: false,
    ChromeOS: false,
    BSD: false,
    Special: false,
  })

  const copyState = ref<'idle' | 'done' | 'failed'>('idle')
  const posterState = ref<'idle' | 'generating' | 'done' | 'failed'>('idle')
  const posterPreviewUrl = ref('')
  const isPosterModalVisible = ref(false)
  const posterError = ref('')
  const errorMessage = ref('')
  const isDimensionPanelCollapsed = ref(true)

  const DIMENSION_SCORE_MIN = 2
  const DIMENSION_SCORE_MAX = 6

  const levelText: Record<Level, string> = {
    L: '低位',
    M: '中位',
    H: '高位',
  }

  const specialTagText: Record<QuizResult['specialCode'], string> = {
    NONE: '',
    XIAOFENG: '隐藏彩蛋：小风同学',
    DRUNK: '彩蛋触发：白酒内核态',
    HHHH: '兜底触发：蓝屏快乐机',
  }

  const questionFlow = computed(() => getQuestionFlow(answers))

  const currentQuestion = computed(() => questionFlow.value[currentIndex.value] ?? null)

  const selectedOption = computed(() => {
    if (!currentQuestion.value) {
      return undefined
    }

    return answers[currentQuestion.value.id]
  })

  const canContinue = computed(() => Boolean(selectedOption.value))
  const isLastQuestion = computed(() => currentIndex.value >= questionFlow.value.length - 1)

  const totalQuestions = computed(() => questionFlow.value.length)

  const progressPercent = computed(() => {
    if (!totalQuestions.value) {
      return 0
    }

    const doneCount = Math.min(
      totalQuestions.value,
      currentIndex.value + (selectedOption.value ? 1 : 0),
    )

    return Math.round((doneCount / totalQuestions.value) * 100)
  })

  const regularAnsweredCount = computed(() => {
    let count = 0

    for (let id = 1; id <= 30; id += 1) {
      if (answers[id]) {
        count += 1
      }
    }

    return count
  })

  function getDimensionScorePercent(score: number): number {
    const normalized = (score - DIMENSION_SCORE_MIN) / (DIMENSION_SCORE_MAX - DIMENSION_SCORE_MIN)

    return Math.max(0, Math.min(100, Math.round(normalized * 100)))
  }

  const dimensionRows = computed(() => {
    if (!result.value) {
      return []
    }

    const currentResult = result.value

    return DIMENSION_ORDER.map((key) => {
      const meta = DIMENSION_META[key]
      const level = currentResult.dimensions[key]
      const score = currentResult.dimensionScores[key]

      return {
        key,
        name: meta.name,
        level,
        levelDescription: meta.levelDescriptions[level],
        practicalTip: meta.practicalTips[level],
        score,
        scorePercent: getDimensionScorePercent(score),
      }
    })
  })

  const displayedTopMatches = computed(() => {
    if (!result.value) {
      return []
    }

    return result.value.topMatches.slice(0, 3)
  })

  const finalSimilarity = computed(() => result.value?.finalMatch.similarity ?? 0)

  const finalSimilarityHint = computed(() => {
    const similarity = finalSimilarity.value

    if (similarity >= 85) {
      return '高度贴合：你的日常模式和这个系统人格非常同频。'
    }

    if (similarity >= 70) {
      return '中高贴合：大多数场景都贴合，偶尔会切到其他模式。'
    }

    if (similarity >= 60) {
      return '中等贴合：这是你当前阶段的主运行风格。'
    }

    return '贴合度偏低：你是高弹性混合体，建议过几天再测一次。'
  })

  const sharePreview = computed(() => result.value?.shareText ?? '')

  const descriptionView = computed(() => {
    const raw = result.value?.finalMatch.profile.description.trim() ?? ''
    const systemToken = '系统特色：'
    const lifeToken = '生活映照：'

    if (!raw.includes(systemToken) || !raw.includes(lifeToken)) {
      return {
        hasSplit: false,
        system: raw,
        life: '',
      }
    }

    const [systemChunk = '', lifeChunk = ''] = raw.split(lifeToken)

    return {
      hasSplit: true,
      system: systemChunk.replace(systemToken, '').trim(),
      life: lifeChunk.trim(),
    }
  })

  function getOsLogoUrl(osFamily: OsFamily): string {
    const slug = osLogoSlugMap[osFamily]

    if (!slug) {
      return ''
    }

    return `https://cdn.simpleicons.org/${slug}/132031`
  }

  function shouldShowLogoImage(osFamily: OsFamily): boolean {
    return !logoLoadFailed[osFamily] && Boolean(osLogoSlugMap[osFamily])
  }

  function markLogoFailed(osFamily: OsFamily): void {
    logoLoadFailed[osFamily] = true
  }

  function getOsLogoFallback(osFamily: OsFamily): string {
    return osLogoFallbackMap[osFamily]
  }

  function toggleDimensionPanel(): void {
    isDimensionPanelCollapsed.value = !isDimensionPanelCollapsed.value
  }

  function resetAnswers(): void {
    Object.keys(answers).forEach((key) => {
      delete answers[Number(key)]
    })
  }

  function resetPosterPreviewState(): void {
    posterState.value = 'idle'
    posterPreviewUrl.value = ''
    isPosterModalVisible.value = false
    posterError.value = ''
  }

  function startTest(): void {
    currentIndex.value = 0
    result.value = null
    isDimensionPanelCollapsed.value = true
    copyState.value = 'idle'
    resetPosterPreviewState()
    errorMessage.value = ''
    resetAnswers()
  }

  function restartTest(): void {
    startTest()
  }

  function ensureQuestionIndexInRange(): void {
    const last = questionFlow.value.length - 1

    if (currentIndex.value > last) {
      currentIndex.value = Math.max(0, last)
    }
  }

  function selectOption(key: OptionKey): void {
    const question = currentQuestion.value

    if (!question) {
      return
    }

    answers[question.id] = key
    copyState.value = 'idle'
    errorMessage.value = ''

    if (question.id === 31 && key !== 'C') {
      delete answers[32]
      ensureQuestionIndexInRange()
    }
  }

  function goPrev(): void {
    currentIndex.value = Math.max(0, currentIndex.value - 1)
  }

  function submitResult(): boolean {
    try {
      result.value = calculateQuizResult(answers)
      isDimensionPanelCollapsed.value = true
      resetPosterPreviewState()
      errorMessage.value = ''
      return true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '计算失败，请重试。'
      return false
    }
  }

  function goNext(): boolean {
    if (!canContinue.value) {
      return false
    }

    if (isLastQuestion.value) {
      return submitResult()
    }

    currentIndex.value += 1
    return false
  }

  async function copyShare(): Promise<void> {
    if (!sharePreview.value) {
      return
    }

    try {
      await navigator.clipboard.writeText(sharePreview.value)
      copyState.value = 'done'
      window.setTimeout(() => {
        copyState.value = 'idle'
      }, 1400)
    } catch {
      copyState.value = 'failed'
    }
  }

  function getShareUrl(): string {
    if (typeof window === 'undefined') {
      return ''
    }

    try {
      return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString()
    } catch {
      return `${window.location.origin}/`
    }
  }

  function wrapCanvasText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const source = text.trim()

    if (!source) {
      return []
    }

    const lines: string[] = []
    let current = ''

    for (const char of source) {
      const next = `${current}${char}`

      if (!current || context.measureText(next).width <= maxWidth) {
        current = next
        continue
      }

      lines.push(current)
      current = char
    }

    if (current) {
      lines.push(current)
    }

    return lines
  }

  function drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number,
  ): number {
    const allLines = wrapCanvasText(context, text, maxWidth)

    if (!allLines.length) {
      return y
    }

    const visibleLineCount = Math.max(1, maxLines)
    const visibleLines = allLines.slice(0, visibleLineCount)

    if (allLines.length > visibleLines.length) {
      const lastIndex = visibleLines.length - 1
      let clipped = visibleLines[lastIndex] ?? ''

      while (clipped.length > 1 && context.measureText(`${clipped}...`).width > maxWidth) {
        clipped = clipped.slice(0, -1)
      }

      visibleLines[lastIndex] = `${clipped}...`
    }

    visibleLines.forEach((line, index) => {
      context.fillText(line, x, y + index * lineHeight)
    })

    return y + visibleLines.length * lineHeight
  }

  function roundedRectPath(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const safeRadius = Math.min(radius, width / 2, height / 2)

    context.beginPath()
    context.moveTo(x + safeRadius, y)
    context.lineTo(x + width - safeRadius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
    context.lineTo(x + width, y + height - safeRadius)
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
    context.lineTo(x + safeRadius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
    context.lineTo(x, y + safeRadius)
    context.quadraticCurveTo(x, y, x + safeRadius, y)
    context.closePath()
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('图片资源加载失败'))
      image.src = src
    })
  }

  function downloadPosterImage(): void {
    if (!posterPreviewUrl.value || !result.value) {
      return
    }

    const link = document.createElement('a')
    link.href = posterPreviewUrl.value
    link.download = `OSTI-${result.value.finalMatch.profile.osFamily}-poster.png`
    link.click()
  }

  function openPosterModal(): void {
    if (!posterPreviewUrl.value) {
      return
    }

    isPosterModalVisible.value = true
  }

  function closePosterModal(): void {
    isPosterModalVisible.value = false
  }

  async function generateSharePoster(): Promise<void> {
    if (!result.value || posterState.value === 'generating') {
      return
    }

    const shareUrl = getShareUrl()

    if (!shareUrl) {
      posterState.value = 'failed'
      posterError.value = '当前环境无法获取分享链接。'
      return
    }

    posterState.value = 'generating'
    posterError.value = ''
    isPosterModalVisible.value = false

    try {
      const width = 1080
      const height = 1720
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('浏览器不支持海报绘制。')
      }

      const match = result.value.finalMatch
      const createdDate = new Date().toLocaleDateString('zh-CN')
      const personaSvgUrl = getPersonaIllustration(match.profile.osFamily)

      const pageGradient = context.createLinearGradient(0, 0, 0, height)
      pageGradient.addColorStop(0, '#f2f7ff')
      pageGradient.addColorStop(1, '#e8f1ff')
      context.fillStyle = pageGradient
      context.fillRect(0, 0, width, height)

      context.fillStyle = 'rgba(57, 121, 255, 0.14)'
      context.beginPath()
      context.arc(-120, 260, 360, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = 'rgba(120, 177, 255, 0.2)'
      context.beginPath()
      context.arc(width - 90, 1540, 300, 0, Math.PI * 2)
      context.fill()

      roundedRectPath(context, 64, 72, width - 128, height - 144, 44)
      context.fillStyle = 'rgba(255, 255, 255, 0.95)'
      context.fill()
      context.lineWidth = 3
      context.strokeStyle = '#d7e6ff'
      context.stroke()

      if (personaSvgUrl) {
        try {
          const portraitImage = await loadImage(personaSvgUrl)
          const portraitX = 806
          const portraitY = 114
          const portraitSize = 168

          roundedRectPath(context, portraitX, portraitY, portraitSize, portraitSize, 22)
          context.fillStyle = '#f3f8ff'
          context.fill()
          context.lineWidth = 2
          context.strokeStyle = '#d5e4ff'
          context.stroke()

          context.drawImage(
            portraitImage,
            portraitX + 16,
            portraitY + 16,
            portraitSize - 32,
            portraitSize - 32,
          )
        } catch {
          // Ignore local illustration load failures and continue poster rendering.
        }
      }

      context.fillStyle = '#2e5ca8'
      context.font = '600 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('OSTI 操作系统人格测试', 116, 164)

      context.fillStyle = '#1a3770'
      context.font = '800 64px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText(match.profile.name, 116, 246)

      context.fillStyle = '#4f6f95'
      context.font = '500 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText(`人格标签：${match.profile.osFamily} · 匹配度 ${match.similarity}%`, 116, 302)

      context.fillStyle = '#2e5ca8'
      context.font = '700 36px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('系统特色', 116, 386)
      context.fillStyle = '#4f6f95'
      context.font = '500 30px "Noto Sans SC", "Microsoft YaHei", sans-serif'

      let currentY = drawWrappedText(context, descriptionView.value.system, 116, 434, 848, 44, 6)

      if (descriptionView.value.life) {
        currentY += 34
        context.fillStyle = '#2e5ca8'
        context.font = '700 36px "Noto Sans SC", "Microsoft YaHei", sans-serif'
        context.fillText('生活映照', 116, currentY)
        currentY += 48
        context.fillStyle = '#4f6f95'
        context.font = '500 30px "Noto Sans SC", "Microsoft YaHei", sans-serif'
        currentY = drawWrappedText(context, descriptionView.value.life, 116, currentY, 848, 44, 5)
      }

      currentY += 48
      context.fillStyle = '#2e5ca8'
      context.font = '700 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('你的优势', 116, currentY)

      currentY += 46
      context.fillStyle = '#4f6f95'
      context.font = '500 30px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      const strengthsText = match.profile.strengths.slice(0, 3).join(' · ')
      currentY = drawWrappedText(context, strengthsText, 116, currentY, 848, 44, 3)

      currentY += 54
      context.fillStyle = '#2e5ca8'
      context.font = '700 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('一句话画像', 116, currentY)

      currentY += 48
      context.fillStyle = '#4f6f95'
      context.font = '500 30px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      drawWrappedText(context, match.profile.memeLine, 116, currentY, 848, 44, 2)

      roundedRectPath(context, 116, 1230, 848, 360, 30)
      context.fillStyle = '#f5f9ff'
      context.fill()
      context.lineWidth = 2
      context.strokeStyle = '#d7e6ff'
      context.stroke()

      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#2351a0',
          light: '#ffffff',
        },
      })

      const qrImage = await loadImage(qrDataUrl)
      context.drawImage(qrImage, 150, 1280, 240, 240)

      context.fillStyle = '#1f4c97'
      context.font = '800 48px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('扫码立即测试', 430, 1372)

      context.fillStyle = '#4f6f95'
      context.font = '500 30px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText('和朋友一起测，看看谁更像 Linux。', 430, 1436)

      context.fillStyle = '#6b86a9'
      context.font = '500 24px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      const visibleUrl =
        shareUrl.length > 46 ? `${shareUrl.slice(0, 43)}...` : shareUrl
      context.fillText(visibleUrl, 430, 1490)

      context.fillStyle = '#7b93b2'
      context.font = '500 24px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      context.fillText(`生成时间：${createdDate}`, 116, 1656)

      posterPreviewUrl.value = canvas.toDataURL('image/png')
      posterState.value = 'done'
      isPosterModalVisible.value = true
    } catch (error) {
      posterState.value = 'failed'
      isPosterModalVisible.value = false
      posterError.value = error instanceof Error ? error.message : '海报生成失败，请稍后重试。'
    }
  }

  return {
    osFamiliesForDisplay,
    currentIndex,
    answers,
    result,
    logoLoadFailed,
    copyState,
    posterState,
    posterPreviewUrl,
    isPosterModalVisible,
    posterError,
    errorMessage,
    isDimensionPanelCollapsed,
    levelText,
    specialTagText,
    questionFlow,
    currentQuestion,
    selectedOption,
    canContinue,
    isLastQuestion,
    totalQuestions,
    progressPercent,
    regularAnsweredCount,
    dimensionRows,
    displayedTopMatches,
    finalSimilarity,
    finalSimilarityHint,
    sharePreview,
    descriptionView,
    getOsLogoUrl,
    shouldShowLogoImage,
    markLogoFailed,
    getOsLogoFallback,
    toggleDimensionPanel,
    startTest,
    restartTest,
    selectOption,
    goPrev,
    goNext,
    copyShare,
    downloadPosterImage,
    openPosterModal,
    closePosterModal,
    generateSharePoster,
  }
}

export function useOstiRuntime(): OstiRuntime {
  if (!runtime) {
    runtime = createOstiRuntime()
  }

  return runtime
}
