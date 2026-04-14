<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import QRCode from 'qrcode'

import { DIMENSION_META } from '@/data/osti-data'
import { calculateQuizResult, getQuestionFlow } from '@/lib/osti-engine'
import {
  DIMENSION_ORDER,
  type Level,
  type OptionKey,
  type PersonaProfile,
  type QuizResult,
} from '@/types/osti'

type Stage = 'intro' | 'quiz' | 'result'
type OsFamily = PersonaProfile['osFamily']

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

const stage = ref<Stage>('intro')
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
const autoNextTimer = ref<number | null>(null)
const copyState = ref<'idle' | 'done' | 'failed'>('idle')
const posterState = ref<'idle' | 'generating' | 'done' | 'failed'>('idle')
const posterPreviewUrl = ref('')
const posterError = ref('')
const errorMessage = ref('')
const DIMENSION_SCORE_MIN = 2
const DIMENSION_SCORE_MAX = 6
const isDimensionPanelCollapsed = ref(true)

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

function clearAutoNextTimer(): void {
  if (autoNextTimer.value !== null) {
    window.clearTimeout(autoNextTimer.value)
    autoNextTimer.value = null
  }
}

function queueAutoNext(): void {
  clearAutoNextTimer()

  autoNextTimer.value = window.setTimeout(() => {
    autoNextTimer.value = null

    if (stage.value !== 'quiz') {
      return
    }

    goNext()
  }, 180)
}

function resetAnswers(): void {
  Object.keys(answers).forEach((key) => {
    delete answers[Number(key)]
  })
}

function startTest(): void {
  stage.value = 'quiz'
  currentIndex.value = 0
  result.value = null
  isDimensionPanelCollapsed.value = true
  copyState.value = 'idle'
  posterState.value = 'idle'
  posterPreviewUrl.value = ''
  posterError.value = ''
  errorMessage.value = ''
  resetAnswers()
}

function restartTest(): void {
  stage.value = 'intro'
  currentIndex.value = 0
  result.value = null
  isDimensionPanelCollapsed.value = true
  copyState.value = 'idle'
  posterState.value = 'idle'
  posterPreviewUrl.value = ''
  posterError.value = ''
  errorMessage.value = ''
  resetAnswers()
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

  queueAutoNext()
}

function goPrev(): void {
  clearAutoNextTimer()
  currentIndex.value = Math.max(0, currentIndex.value - 1)
}

function submitResult(): void {
  try {
    result.value = calculateQuizResult(answers)
    isDimensionPanelCollapsed.value = true
    stage.value = 'result'
    posterState.value = 'idle'
    posterPreviewUrl.value = ''
    posterError.value = ''
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '计算失败，请重试。'
  }
}

function goNext(): void {
  clearAutoNextTimer()

  if (!canContinue.value) {
    return
  }

  if (isLastQuestion.value) {
    submitResult()
    return
  }

  currentIndex.value += 1
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

  return window.location.href
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

function closePosterPreview(): void {
  posterState.value = 'idle'
  posterError.value = ''
  posterPreviewUrl.value = ''
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
  } catch (error) {
    posterState.value = 'failed'
    posterError.value = error instanceof Error ? error.message : '海报生成失败，请稍后重试。'
  }
}

function handleKeyboard(event: KeyboardEvent): void {
  if (stage.value !== 'quiz' || !currentQuestion.value) {
    return
  }

  const key = event.key.toUpperCase()
  const availableKeys = currentQuestion.value.options.map((option) => option.key)

  if (availableKeys.includes(key as OptionKey)) {
    selectOption(key as OptionKey)
    return
  }

  if (key === 'ENTER') {
    goNext()
  }

  if (key === 'BACKSPACE') {
    goPrev()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard)
})

onBeforeUnmount(() => {
  clearAutoNextTimer()
  window.removeEventListener('keydown', handleKeyboard)
})
</script>

<template>
  <main class="page">
    <section v-if="stage === 'intro'" class="panel intro fade-in">
      <p class="eyebrow">OSTI · Campus Edition</p>
      <h1>你的性格，更像哪一种操作系统？</h1>
      <p class="lead">
        几分钟答完，得到可读、可分享、可复测的 OS 人格画像。
      </p>

      <div class="intro-chip-row">
        <span class="intro-chip">30 + 3 题</span>
        <span class="intro-chip">15 维评估</span>
        <span class="intro-chip">约 6-10 分钟</span>
      </div>

      <div class="intro-note">
        <p>答完即可查看并分享结果。</p>
      </div>

      <div class="actions intro-actions">
        <button class="btn btn-primary" type="button" @click="startTest">开始 OSTI 测试</button>
      </div>

      <p class="disclaimer">
        免责声明：OSTI 是“自我观察 + 娱乐表达”工具，不可替代临床心理评估与医疗建议。
      </p>
    </section>

    <section v-else-if="stage === 'quiz'" class="panel quiz fade-in">
      <header class="quiz-head">
        <div>
          <p class="eyebrow">答题中</p>
          <h2>第 {{ currentIndex + 1 }} / {{ totalQuestions }} 题</h2>
        </div>
        <div class="progress-meta">
          <span>完成 {{ progressPercent }}%</span>
          <span>常规题 {{ regularAnsweredCount }}/30</span>
        </div>
      </header>

      <div class="progress-wrap" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <article v-if="currentQuestion" class="question-card">
        <p v-if="currentQuestion.subtitle" class="question-subtitle">{{ currentQuestion.subtitle }}</p>
        <h3>{{ currentQuestion.prompt }}</h3>

        <div class="option-list">
          <button
            v-for="option in currentQuestion.options"
            :key="option.key"
            class="option-btn"
            :class="{ active: answers[currentQuestion.id] === option.key }"
            type="button"
            @click="selectOption(option.key)"
          >
            <span class="option-key">{{ option.key }}</span>
            <span>{{ option.text }}</span>
          </button>
        </div>
      </article>

      <div class="quiz-controls">
        <button class="btn btn-ghost" type="button" :disabled="currentIndex === 0" @click="goPrev">上一题</button>
        <button class="btn btn-primary" type="button" :disabled="!canContinue" @click="goNext">
          {{ isLastQuestion ? '查看结果' : '下一题' }}
        </button>
      </div>

      <p class="keyboard-tip">点击选项会自动下一题。快捷键：A/B/C/D 选项，Backspace 上一题。</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </section>

    <section v-else class="panel result fade-in">
      <header class="result-head">
        <p class="eyebrow">测试结果</p>
        <div v-if="result" class="result-os-pill">
          <span class="os-logo" :class="{ 'os-logo-text': !shouldShowLogoImage(result.finalMatch.profile.osFamily) }">
            <img
              v-if="shouldShowLogoImage(result.finalMatch.profile.osFamily)"
              :src="getOsLogoUrl(result.finalMatch.profile.osFamily)"
              :alt="`${result.finalMatch.profile.osFamily} logo`"
              loading="lazy"
              @error="markLogoFailed(result.finalMatch.profile.osFamily)"
            />
            <span v-else>{{ getOsLogoFallback(result.finalMatch.profile.osFamily) }}</span>
          </span>
          <strong>{{ result.finalMatch.profile.osFamily }} Logo</strong>
        </div>
        <h2>{{ result?.finalMatch.profile.name }}</h2>
        <p class="result-tagline">{{ result?.finalMatch.profile.tagline }}</p>
      </header>

      <article class="logo-wall">
        <h3>操作系统 Logo 墙</h3>
        <div class="logo-grid">
          <div class="logo-chip" v-for="family in osFamiliesForDisplay" :key="family">
            <span class="os-logo" :class="{ 'os-logo-text': !shouldShowLogoImage(family) }">
              <img
                v-if="shouldShowLogoImage(family)"
                :src="getOsLogoUrl(family)"
                :alt="`${family} logo`"
                loading="lazy"
                @error="markLogoFailed(family)"
              />
              <span v-else>{{ getOsLogoFallback(family) }}</span>
            </span>
            <span>{{ family }}</span>
          </div>
        </div>
      </article>

      <article class="hero-result">
        <div class="hero-metric">
          <span>系统人格</span>
          <strong>{{ result?.finalMatch.profile.osFamily }}</strong>
        </div>
        <div class="hero-metric">
          <span>匹配度</span>
          <strong>{{ result?.finalMatch.similarity }}%</strong>
        </div>
        <div class="hero-metric">
          <span>抽象指数</span>
          <strong>{{ result?.chaosIndex }}</strong>
        </div>
        <div class="hero-metric">
          <span>稳定度</span>
          <strong>{{ result?.reliability.consistency }}%</strong>
        </div>
      </article>

      <article class="match-visual">
        <div class="meter-head">
          <span>主人格贴合度</span>
          <strong>{{ finalSimilarity }}%</strong>
        </div>
        <div class="meter-track" role="progressbar" :aria-valuenow="finalSimilarity" aria-valuemin="0" aria-valuemax="100">
          <div class="meter-fill" :style="{ width: `${finalSimilarity}%` }"></div>
        </div>
        <p class="meter-note">{{ finalSimilarityHint }}</p>
      </article>

      <p class="special-tag" v-if="result && result.specialCode !== 'NONE'">
        {{ specialTagText[result.specialCode] }}
      </p>

      <article class="description-card" v-if="result">
        <div class="description-col">
          <h3>系统特色</h3>
          <p>{{ descriptionView.system }}</p>
        </div>
        <div class="description-col" v-if="descriptionView.life">
          <h3>生活映照</h3>
          <p>{{ descriptionView.life }}</p>
        </div>
      </article>
      <p class="meme-line">“{{ result?.finalMatch.profile.memeLine }}”</p>

      <div class="cols">
        <article class="card">
          <h3>你的优势</h3>
          <ul>
            <li v-for="item in result?.finalMatch.profile.strengths" :key="item">{{ item }}</li>
          </ul>
        </article>

        <article class="card">
          <h3>容易踩坑</h3>
          <ul>
            <li v-for="item in result?.finalMatch.profile.blindSpots" :key="item">{{ item }}</li>
          </ul>
        </article>

        <article class="card">
          <h3>行动建议</h3>
          <ul>
            <li v-for="item in result?.finalMatch.profile.recommendations" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>

      <article class="share-card">
        <h3>分享文案</h3>
        <p>{{ sharePreview }}</p>
        <div class="share-actions">
          <button class="btn btn-primary" type="button" @click="copyShare">
            {{ copyState === 'done' ? '已复制' : copyState === 'failed' ? '复制失败，请手动复制' : '复制结果文案' }}
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            :disabled="posterState === 'generating'"
            @click="generateSharePoster"
          >
            {{ posterState === 'generating' ? '海报生成中...' : posterPreviewUrl ? '重新生成分享海报' : '生成分享海报（含二维码）' }}
          </button>
        </div>
        <p class="share-tip">点击生成后会在下方展示海报预览，扫码可直接打开本站。</p>
        <p v-if="posterState === 'done'" class="share-tip share-tip-success">
          海报已生成，下方可预览与保存。
        </p>
        <p v-else-if="posterState === 'failed'" class="error-text">{{ posterError }}</p>

        <div v-if="posterPreviewUrl" class="poster-preview-shell">
          <p class="poster-preview-title">分享你的编程人格</p>
          <p class="poster-preview-subtitle">长按预览图可保存到手机，或点击下方按钮保存原图。</p>

          <div class="poster-preview-card">
            <img :src="posterPreviewUrl" alt="OSTI 分享海报预览" loading="lazy" />
          </div>

          <div class="poster-preview-actions">
            <button class="btn btn-poster-solid" type="button" @click="downloadPosterImage">保存海报</button>
            <button class="btn btn-poster-outline" type="button" @click="closePosterPreview">收起预览</button>
          </div>
        </div>
      </article>

      <article class="match-card">
        <h3>Top 3 常规模型匹配</h3>
        <div class="match-list">
          <div class="match-item" v-for="item in displayedTopMatches" :key="item.profile.code">
            <div class="match-item-top">
              <div class="match-main">
                <span class="os-logo os-logo-mini" :class="{ 'os-logo-text': !shouldShowLogoImage(item.profile.osFamily) }">
                  <img
                    v-if="shouldShowLogoImage(item.profile.osFamily)"
                    :src="getOsLogoUrl(item.profile.osFamily)"
                    :alt="`${item.profile.osFamily} logo`"
                    loading="lazy"
                    @error="markLogoFailed(item.profile.osFamily)"
                  />
                  <span v-else>{{ getOsLogoFallback(item.profile.osFamily) }}</span>
                </span>
                <div>
                  <strong>{{ item.profile.name }}</strong>
                  <p>{{ item.profile.osFamily }} · {{ item.profile.code }}</p>
                </div>
              </div>
              <span class="match-score">{{ item.similarity }}%</span>
            </div>
            <div class="match-bar-track">
              <div class="match-bar-fill" :style="{ width: `${item.similarity}%` }"></div>
            </div>
          </div>
        </div>
        <p v-if="result?.fallbackMatch" class="fallback-note">
          常规最优结果：{{ result.fallbackMatch.profile.name }}（{{ result.fallbackMatch.similarity }}%）
        </p>
      </article>

      <article class="dimension-card">
        <h3>15 维行为画像</h3>
        <div class="dimension-toolbar">
          <p class="dimension-hint">折叠后会隐藏全部 15 个维度，展开后再查看具体维度和进度条。</p>
          <button class="btn btn-ghost btn-mini" type="button" @click="toggleDimensionPanel">
            {{ isDimensionPanelCollapsed ? '展开 15 维画像' : '折叠 15 维画像' }}
          </button>
        </div>

        <p v-if="isDimensionPanelCollapsed" class="dimension-collapsed-note">
          当前为折叠状态，15 个维度已隐藏。
        </p>

        <div v-else class="dimension-list">
          <div class="dimension-item" v-for="row in dimensionRows" :key="row.key">
            <header>
              <strong>{{ row.name }}</strong>
              <span>{{ levelText[row.level] }}（{{ row.score }} 分）</span>
            </header>

            <div class="dimension-score-wrap">
              <div
                class="dimension-score-track"
                role="progressbar"
                :aria-valuenow="row.scorePercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div class="dimension-score-fill" :style="{ width: `${row.scorePercent}%` }"></div>
              </div>
              <span class="dimension-score-text">{{ row.scorePercent }}%</span>
            </div>

            <div class="dimension-body">
              <p>{{ row.levelDescription }}</p>
              <p class="dim-tip">建议：{{ row.practicalTip }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="reliability-card">
        <h3>结果稳定度提示</h3>
        <p>{{ result?.reliability.interpretation }}</p>
        <p>如果你的答案受当下情绪影响较大，建议间隔 3-7 天重测并比较变化。</p>
      </article>

      <div class="actions">
        <button class="btn btn-ghost" type="button" @click="startTest">重新测试</button>
        <button class="btn btn-primary" type="button" @click="restartTest">返回首页</button>
      </div>
    </section>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Prata&display=swap');

:root {
  --bg-top: #edf4ff;
  --bg-bottom: #f8fbff;
  --text-main: #102641;
  --text-sub: #5d7590;
  --card-bg: rgba(255, 255, 255, 0.9);
  --card-border: rgba(23, 74, 150, 0.12);
  --brand: #245dff;
  --brand-strong: #1b48c7;
  --accent: #7ac4ff;
  --accent-soft: #e8f2ff;
  --danger: #bf2f2f;
  --shadow: 0 22px 55px rgba(26, 57, 102, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text-main);
  background: linear-gradient(170deg, var(--bg-top) 0%, var(--bg-bottom) 100%);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

h1,
h2,
h3,
p {
  margin: 0;
}

.page {
  min-height: 100dvh;
  padding: clamp(20px, 4vw, 42px) 16px calc(40px + env(safe-area-inset-bottom));
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 0%, rgba(104, 162, 255, 0.24) 0%, rgba(104, 162, 255, 0) 38%),
    radial-gradient(circle at 100% 100%, rgba(61, 111, 255, 0.16) 0%, rgba(61, 111, 255, 0) 40%),
    linear-gradient(168deg, #f4f8ff 0%, #edf3ff 56%, #f7faff 100%);
}

.page::before,
.page::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.page::before {
  background-image:
    linear-gradient(rgba(64, 125, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 125, 255, 0.08) 1px, transparent 1px);
  background-size: 38px 38px;
  opacity: 0.22;
}

.page::after {
  background:
    radial-gradient(520px 220px at 50% 0%, rgba(74, 129, 255, 0.2), transparent 72%),
    radial-gradient(580px 240px at 90% 100%, rgba(102, 176, 255, 0.16), transparent 75%);
  opacity: 0.7;
}

.panel {
  max-width: 980px;
  margin: 0 auto;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
  padding: 34px;
  position: relative;
  z-index: 2;
}

.eyebrow {
  font-size: 0.86rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--brand-strong);
  font-weight: 700;
}

.intro h1,
.quiz h2,
.result h2 {
  margin-top: 10px;
  font-size: clamp(2rem, 4.2vw, 3.2rem);
  line-height: 1.1;
  font-family: 'Prata', 'Noto Serif SC', serif;
  letter-spacing: 0.01em;
}

.lead {
  margin-top: 14px;
  color: var(--text-sub);
  line-height: 1.7;
  font-size: 1.02rem;
}

.intro {
  text-align: center;
}

.intro-chip-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.intro-chip {
  border: 1px solid #d7e5ff;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.9rem;
  color: #2b4f7a;
  background: #f4f9ff;
}

.intro-note {
  margin: 18px auto 0;
  max-width: 640px;
  border: 1px solid #dce9ff;
  border-radius: 14px;
  background: #fbfdff;
  padding: 12px 14px;
  display: grid;
  gap: 6px;
  color: var(--text-sub);
  line-height: 1.6;
}

.intro-actions {
  justify-content: center;
}

.card ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: var(--text-sub);
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(130deg, var(--brand), #3c84ff);
  box-shadow: 0 12px 22px rgba(48, 111, 255, 0.25);
}

.btn-ghost {
  color: var(--brand-strong);
  border: 1px solid rgba(36, 93, 255, 0.28);
  background: #fff;
}

.disclaimer,
.keyboard-tip,
.fallback-note,
.result-tagline,
.meme-line {
  color: var(--text-sub);
}

.disclaimer {
  margin-top: 14px;
  font-size: 0.92rem;
  line-height: 1.6;
}

.quiz-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.progress-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  color: var(--text-sub);
  font-size: 0.92rem;
}

.progress-wrap {
  margin-top: 16px;
  height: 12px;
  background: #e9f0f7;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), #4f92ff, #7ac4ff);
  transition: width 0.25s ease;
}

.question-card {
  margin-top: 18px;
  border-radius: 20px;
  border: 1px solid var(--card-border);
  background: #fff;
  padding: 24px;
}

.question-subtitle {
  font-size: 0.86rem;
  color: #6f7f91;
}

.question-card h3 {
  margin-top: 12px;
  font-size: clamp(1.26rem, 2.6vw, 2rem);
  line-height: 1.35;
}

.option-list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #d8e1eb;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  padding: 12px 14px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: all 0.18s ease;
}

.option-btn:hover {
  border-color: rgba(36, 93, 255, 0.4);
  transform: translateX(2px);
}

.option-btn.active {
  border-color: #2f6bff;
  background: #edf3ff;
}

.option-key {
  min-width: 28px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #edf3f9;
  font-weight: 700;
}

.option-btn.active .option-key {
  background: #2f6bff;
  color: #fff;
}

.quiz-controls {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.keyboard-tip {
  margin-top: 12px;
  font-size: 0.9rem;
}

.error-text {
  margin-top: 10px;
  color: var(--danger);
}

.result-head {
  text-align: center;
}

.result-os-pill {
  margin: 12px auto 0;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #deecf5;
  border-radius: 999px;
  background: #f4fbff;
}

.logo-wall {
  margin-top: 14px;
  border: 1px solid var(--card-border);
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.logo-wall h3 {
  margin-bottom: 10px;
}

.logo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.logo-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2ebf4;
  border-radius: 10px;
  padding: 8px;
  background: #fbfdff;
}

.os-logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #d9e5f1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.os-logo img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.os-logo-text {
  font-size: 0.63rem;
  font-weight: 700;
  color: #4c6278;
}

.os-logo-mini {
  width: 24px;
  height: 24px;
  border-radius: 7px;
}

.os-logo-mini img {
  width: 15px;
  height: 15px;
}

.result-tagline {
  margin-top: 10px;
}

.hero-result {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--card-border);
  background: #fff;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.hero-metric {
  background: linear-gradient(150deg, #f1f6ff, #f8fbff);
  border: 1px solid #deecf5;
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.hero-metric span {
  color: #678095;
  font-size: 0.82rem;
}

.hero-metric strong {
  font-size: 1.2rem;
}

.match-visual {
  margin-top: 14px;
  border: 1px solid var(--card-border);
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.meter-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.meter-head span {
  color: #647f96;
  font-size: 0.9rem;
}

.meter-head strong {
  font-size: 1.1rem;
}

.meter-track {
  margin-top: 8px;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: #e6edf5;
}

.meter-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #245dff, #4f92ff, #7ac4ff);
  transition: width 0.3s ease;
}

.meter-note {
  margin-top: 8px;
  color: var(--text-sub);
  line-height: 1.5;
}

.special-tag {
  margin-top: 12px;
  display: inline-flex;
  background: var(--accent-soft);
  color: #2a57a7;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.description-card {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.description-col {
  border: 1px solid #dce9f4;
  border-radius: 12px;
  background: #fbfdff;
  padding: 12px;
}

.description-col h3 {
  margin-bottom: 6px;
  font-size: 0.96rem;
}

.description-col p {
  color: var(--text-sub);
  line-height: 1.65;
}

.meme-line {
  margin-top: 8px;
  font-style: italic;
}

.cols {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.card,
.share-card,
.match-card,
.dimension-card,
.reliability-card {
  margin-top: 16px;
  border-radius: 16px;
  border: 1px solid var(--card-border);
  background: #fff;
  padding: 16px;
}

.card h3,
.share-card h3,
.match-card h3,
.dimension-card h3,
.reliability-card h3 {
  margin-bottom: 10px;
}

.share-card p,
.reliability-card p {
  line-height: 1.6;
}

.share-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.share-tip {
  margin-top: 10px;
  color: var(--text-sub);
  font-size: 0.9rem;
}

.share-tip-success {
  color: #2a57a7;
  font-weight: 600;
}

.poster-preview-shell {
  margin-top: 14px;
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(165deg, #ff9137 0%, #ff6a2d 54%, #ee4c2f 100%);
  color: #fff;
}

.poster-preview-title {
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.poster-preview-subtitle {
  margin-top: 6px;
  text-align: center;
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.92);
}

.poster-preview-card {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.poster-preview-card img {
  width: min(100%, 360px);
  border-radius: 16px;
  display: block;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 14px 30px rgba(61, 18, 0, 0.22);
}

.poster-preview-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-poster-solid {
  color: #eb5824;
  background: #fff;
  box-shadow: none;
}

.btn-poster-outline {
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.14);
}

.match-list {
  display: grid;
  gap: 10px;
}

.match-item {
  display: grid;
  gap: 10px;
  border: 1px solid #e1e9f1;
  border-radius: 12px;
  padding: 10px;
}

.match-item-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.match-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-score {
  font-weight: 700;
}

.match-bar-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #e9eff6;
}

.match-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #245dff, #4f92ff);
}

.match-item p {
  margin-top: 4px;
  color: var(--text-sub);
  font-size: 0.9rem;
}

.dimension-list {
  display: grid;
  gap: 10px;
}

.dimension-hint {
  margin: 0;
  color: var(--text-sub);
  font-size: 0.92rem;
}

.dimension-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.btn-mini {
  padding: 8px 12px;
  font-size: 0.88rem;
}

.dimension-collapsed-note {
  margin: 2px 0 0;
  color: #617b92;
  font-size: 0.92rem;
}

.dimension-item {
  border: 1px solid #e2ebf4;
  border-radius: 12px;
  padding: 12px;
  background: #fbfdff;
}

.dimension-item header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.dimension-item header span {
  color: var(--text-sub);
}

.dimension-score-wrap {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dimension-score-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #e7eef6;
}

.dimension-score-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #245dff, #6ea5ff);
}

.dimension-score-text {
  min-width: 44px;
  text-align: right;
  font-size: 0.86rem;
  color: #5a738a;
}

.dimension-body p {
  margin-top: 6px;
  color: var(--text-sub);
  line-height: 1.55;
}

.dim-tip {
  color: #2a57a7;
}

.fade-in {
  animation: rise 0.45s ease;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 920px) {
  .panel {
    padding: 22px;
    border-radius: 22px;
  }

  .quiz-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .share-actions .btn {
    flex: 1 1 220px;
  }

  .cols,
  .hero-result,
  .description-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .logo-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .page {
    padding: 14px 10px calc(26px + env(safe-area-inset-bottom));
  }

  .panel {
    padding: 14px;
    border-radius: 18px;
  }

  .intro h1,
  .quiz h2,
  .result h2 {
    margin-top: 8px;
    font-size: clamp(1.62rem, 7vw, 2.2rem);
    line-height: 1.2;
  }

  .lead {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .intro-chip-row {
    margin-top: 16px;
    gap: 8px;
  }

  .intro-note {
    margin-top: 14px;
    text-align: left;
  }

  .cols,
  .hero-result,
  .description-card {
    grid-template-columns: 1fr;
  }

  .logo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .option-btn {
    align-items: flex-start;
    min-height: 58px;
    padding: 12px;
  }

  .question-card {
    padding: 16px;
    border-radius: 16px;
  }

  .question-card h3 {
    font-size: 1.2rem;
  }

  .quiz-controls {
    position: sticky;
    bottom: calc(8px + env(safe-area-inset-bottom));
    z-index: 6;
    background: rgba(245, 250, 255, 0.96);
    padding: 10px;
    border-radius: 14px;
    border: 1px solid #dbe8ff;
    backdrop-filter: blur(6px);
  }

  .actions,
  .quiz-controls {
    flex-direction: column;
  }

  .share-actions {
    flex-direction: column;
  }

  .poster-preview-actions {
    flex-direction: column;
  }

  .match-item-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .logo-wall,
  .match-card,
  .dimension-card,
  .share-card,
  .reliability-card {
    padding: 12px;
    border-radius: 14px;
  }

  .dimension-item {
    padding: 10px;
  }

  .keyboard-tip {
    font-size: 0.84rem;
  }

  .btn {
    width: 100%;
  }
}
</style>
