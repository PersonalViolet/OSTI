<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useOstiRuntime } from '@/composables/useOstiRuntime'
import type { OptionKey } from '@/types/osti'

const router = useRouter()
const osti = useOstiRuntime()

const currentIndex = osti.currentIndex
const totalQuestions = osti.totalQuestions
const progressPercent = osti.progressPercent
const regularAnsweredCount = osti.regularAnsweredCount
const currentQuestion = osti.currentQuestion
const answers = osti.answers
const canContinue = osti.canContinue
const isLastQuestion = osti.isLastQuestion
const errorMessage = osti.errorMessage

const autoNextTimer = ref<number | null>(null)

function clearAutoNextTimer(): void {
  if (autoNextTimer.value !== null) {
    window.clearTimeout(autoNextTimer.value)
    autoNextTimer.value = null
  }
}

function goNextWithRoute(): void {
  const submitted = osti.goNext()

  if (submitted) {
    void router.push('/result')
  }
}

function selectOptionAndQueue(key: OptionKey): void {
  osti.selectOption(key)
  clearAutoNextTimer()

  autoNextTimer.value = window.setTimeout(() => {
    autoNextTimer.value = null
    goNextWithRoute()
  }, 180)
}

function goPrevWithTimerClear(): void {
  clearAutoNextTimer()
  osti.goPrev()
}

function handleKeyboard(event: KeyboardEvent): void {
  const question = currentQuestion.value

  if (!question) {
    return
  }

  const key = event.key.toUpperCase()
  const availableKeys = question.options.map((option) => option.key)

  if (availableKeys.includes(key as OptionKey)) {
    selectOptionAndQueue(key as OptionKey)
    return
  }

  if (key === 'ENTER') {
    goNextWithRoute()
    return
  }

  if (key === 'BACKSPACE') {
    goPrevWithTimerClear()
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
  <section class="panel quiz fade-in">
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

    <div
      class="progress-wrap"
      role="progressbar"
      :aria-valuenow="String(progressPercent)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
    </div>

    <article v-if="currentQuestion" class="question-card">
      <h3>{{ currentQuestion.prompt }}</h3>

      <div class="option-list">
        <button
          v-for="option in currentQuestion.options"
          :key="option.key"
          class="option-btn"
          :class="{ active: answers[currentQuestion.id] === option.key }"
          type="button"
          @click="selectOptionAndQueue(option.key)"
        >
          <span class="option-key">{{ option.key }}</span>
          <span>{{ option.text }}</span>
        </button>
      </div>
    </article>

    <div class="quiz-controls">
      <button class="btn btn-ghost" type="button" :disabled="currentIndex === 0" @click="goPrevWithTimerClear">上一题</button>
      <button class="btn btn-primary" type="button" :disabled="!canContinue" @click="goNextWithRoute">
        {{ isLastQuestion ? '查看结果' : '下一题' }}
      </button>
    </div>

    <p class="keyboard-tip">点击选项会自动下一题。快捷键：A/B/C 选项，Backspace 上一题。</p>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </section>
</template>
