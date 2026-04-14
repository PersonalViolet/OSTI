<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { getPersonaIllustration } from '@/lib/persona-illustration'
import { useOstiRuntime } from '@/composables/useOstiRuntime'

const router = useRouter()
const osti = useOstiRuntime()

const result = osti.result
const osFamiliesForDisplay = osti.osFamiliesForDisplay
const displayedTopMatches = osti.displayedTopMatches
const dimensionRows = osti.dimensionRows
const finalSimilarity = osti.finalSimilarity
const finalSimilarityHint = osti.finalSimilarityHint
const descriptionView = osti.descriptionView
const sharePreview = osti.sharePreview
const copyState = osti.copyState
const posterState = osti.posterState
const posterPreviewUrl = osti.posterPreviewUrl
const isPosterModalVisible = osti.isPosterModalVisible
const posterError = osti.posterError
const specialTagText = osti.specialTagText
const levelText = osti.levelText
const isDimensionPanelCollapsed = osti.isDimensionPanelCollapsed

const resultPersonaSvg = computed(() => {
  if (!result.value) {
    return null
  }

  return getPersonaIllustration(result.value.finalMatch.profile.osFamily)
})

const {
  shouldShowLogoImage,
  getOsLogoUrl,
  markLogoFailed,
  getOsLogoFallback,
  toggleDimensionPanel,
  copyShare,
  generateSharePoster,
  openPosterModal,
  closePosterModal,
  downloadPosterImage,
} = osti

function restartQuiz(): void {
  osti.startTest()
  void router.push('/quiz')
}

function backHome(): void {
  osti.restartTest()
  void router.push('/')
}

function handleResultKeyboard(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isPosterModalVisible.value) {
    closePosterModal()
  }
}

onMounted(() => {
  if (!result.value) {
    void router.replace('/')
    return
  }

  window.addEventListener('keydown', handleResultKeyboard)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleResultKeyboard)
})
</script>

<template>
  <section v-if="result" class="panel result fade-in">
    <header class="result-head">
      <p class="eyebrow">测试结果</p>
      <div class="result-os-pill">
        <span class="os-logo" :class="{ 'os-logo-text': !shouldShowLogoImage(result.finalMatch.profile.osFamily) }">
          <img
            v-if="shouldShowLogoImage(result.finalMatch.profile.osFamily)"
            :src="getOsLogoUrl(result.finalMatch.profile.osFamily)"
            :alt="`${result.finalMatch.profile.osFamily} logo`"
            loading="lazy"
            @error="markLogoFailed(result.finalMatch.profile.osFamily)"
          >
          <span v-else>{{ getOsLogoFallback(result.finalMatch.profile.osFamily) }}</span>
        </span>
        <strong>{{ result.finalMatch.profile.osFamily }} Logo</strong>
      </div>
      <h2>{{ result.finalMatch.profile.name }}</h2>
      <p class="result-tagline">{{ result.finalMatch.profile.tagline }}</p>

      <div v-if="resultPersonaSvg" class="result-illustration">
        <img :src="resultPersonaSvg" :alt="`${result.finalMatch.profile.osFamily} 人格图`" loading="lazy">
      </div>
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
            >
            <span v-else>{{ getOsLogoFallback(family) }}</span>
          </span>
          <span>{{ family }}</span>
        </div>
      </div>
    </article>

    <article class="hero-result">
      <div class="hero-metric">
        <span>系统人格</span>
        <strong>{{ result.finalMatch.profile.osFamily }}</strong>
      </div>
      <div class="hero-metric">
        <span>匹配度</span>
        <strong>{{ result.finalMatch.similarity }}%</strong>
      </div>
      <div class="hero-metric">
        <span>抽象指数</span>
        <strong>{{ result.chaosIndex }}</strong>
      </div>
      <div class="hero-metric">
        <span>稳定度</span>
        <strong>{{ result.reliability.consistency }}%</strong>
      </div>
    </article>

    <article class="match-visual">
      <div class="meter-head">
        <span>主人格贴合度</span>
        <strong>{{ finalSimilarity }}%</strong>
      </div>
      <div class="meter-track" role="progressbar" :aria-valuenow="String(finalSimilarity)" aria-valuemin="0" aria-valuemax="100">
        <div class="meter-fill" :style="{ width: `${finalSimilarity}%` }"></div>
      </div>
      <p class="meter-note">{{ finalSimilarityHint }}</p>
    </article>

    <p class="special-tag" v-if="result.specialCode !== 'NONE'">
      {{ specialTagText[result.specialCode] }}
    </p>

    <article class="description-card">
      <div class="description-col">
        <h3>系统特色</h3>
        <p>{{ descriptionView.system }}</p>
      </div>
      <div class="description-col" v-if="descriptionView.life">
        <h3>生活映照</h3>
        <p>{{ descriptionView.life }}</p>
      </div>
    </article>
    <p class="meme-line">“{{ result.finalMatch.profile.memeLine }}”</p>

    <div class="cols">
      <article class="card">
        <h3>你的优势</h3>
        <ul>
          <li v-for="item in result.finalMatch.profile.strengths" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="card">
        <h3>容易踩坑</h3>
        <ul>
          <li v-for="item in result.finalMatch.profile.blindSpots" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="card">
        <h3>行动建议</h3>
        <ul>
          <li v-for="item in result.finalMatch.profile.recommendations" :key="item">{{ item }}</li>
        </ul>
      </article>
    </div>

    <article class="share-card">
      <h3>分享文案</h3>
      <p>{{ sharePreview }}</p>
      <div class="share-actions share-actions-compact">
        <button class="btn btn-primary share-mobile-btn" type="button" @click="copyShare">
          {{ copyState === 'done' ? '已复制' : copyState === 'failed' ? '复制失败，请手动复制' : '复制结果文案' }}
        </button>
        <button
          class="btn btn-ghost share-mobile-btn"
          type="button"
          :disabled="posterState === 'generating'"
          @click="generateSharePoster"
        >
          {{ posterState === 'generating' ? '海报生成中...' : posterPreviewUrl ? '重新生成分享海报' : '生成分享海报（含二维码）' }}
        </button>
        <button
          v-if="posterPreviewUrl && !isPosterModalVisible"
          class="btn btn-ghost share-mobile-btn"
          type="button"
          @click="openPosterModal"
        >
          查看海报
        </button>
      </div>
      <p class="share-tip">点击生成后会通过弹窗展示蓝色海报预览，扫码可直接打开本站。</p>
      <p v-if="posterState === 'done'" class="share-tip share-tip-success">
        海报已生成，弹窗内可预览与保存。
      </p>
      <p v-else-if="posterState === 'failed'" class="error-text">{{ posterError }}</p>
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
                >
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
      <p v-if="result.fallbackMatch" class="fallback-note">
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
              :aria-valuenow="String(row.scorePercent)"
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
      <p>{{ result.reliability.interpretation }}</p>
      <p>如果你的答案受当下情绪影响较大，建议间隔 3-7 天重测并比较变化。</p>
    </article>

    <div class="actions">
      <button class="btn btn-ghost" type="button" @click="restartQuiz">重新测试</button>
      <button class="btn btn-primary" type="button" @click="backHome">返回首页</button>
    </div>
  </section>

  <div
    v-if="posterPreviewUrl && isPosterModalVisible"
    class="poster-modal-mask"
    role="dialog"
    aria-modal="true"
    aria-label="分享海报预览"
    @click.self="closePosterModal"
  >
    <div class="poster-modal">
      <div class="poster-modal-head">
        <div>
          <p class="poster-modal-title">分享海报预览</p>
          <p class="poster-modal-subtitle">蓝色主题海报，扫码可直接打开本站。</p>
        </div>
        <button class="poster-close-btn" type="button" @click="closePosterModal">关闭</button>
      </div>

      <div class="poster-modal-body">
        <img :src="posterPreviewUrl" alt="OSTI 分享海报预览" loading="lazy">
      </div>

      <div class="poster-modal-actions">
        <button class="btn btn-primary" type="button" @click="downloadPosterImage">保存海报</button>
        <button class="btn btn-ghost" type="button" @click="closePosterModal">完成</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 640px) {
  .share-actions.share-actions-compact {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 6px;
  }

  .share-actions.share-actions-compact .btn.share-mobile-btn {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    max-width: none;
    padding: 8px 6px;
    border-radius: 10px;
    font-size: 0.76rem;
    line-height: 1.2;
    white-space: normal;
    word-break: break-word;
  }
}
</style>
