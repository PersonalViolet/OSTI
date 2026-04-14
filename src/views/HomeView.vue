<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useOstiRuntime } from '@/composables/useOstiRuntime'

const router = useRouter()
const osti = useOstiRuntime()

function startQuiz(): void {
  osti.startTest()
  void router.push('/quiz')
}

function openPersonaAtlas(): void {
  void router.push('/personas')
}
</script>

<template>
  <section class="panel intro fade-in">
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
      <p>答完即可查看并分享结果。本测试结果仅用于娱乐和自我了解，不用于任何专业心理评估。</p>
    </div>

    <div class="actions intro-actions">
      <button class="btn btn-primary" type="button" @click="startQuiz">开始 OSTI 测试</button>
      <button class="btn btn-ghost" type="button" @click="openPersonaAtlas">展示所有人格</button>
    </div>
    <div class="actions intro-actions">
      <a
        class="btn btn-github"
        href="https://github.com/PersonalViolet/OSTI"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="前往 GitHub 查看 OSTI 源代码"
      >
        <svg
          class="github-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.59C4 13.96 3.48 12.75 3.32 12.29C3.23 12.06 2.84 11.35 2.5 11.16C2.22 11.01 1.82 10.63 2.49 10.62C3.12 10.61 3.57 11.2 3.72 11.43C4.44 12.64 5.59 12.3 6.05 12.08C6.12 11.56 6.33 11.21 6.56 11.01C4.78 10.81 2.92 10.12 2.92 7.06C2.92 6.19 3.23 5.48 3.74 4.92C3.66 4.72 3.38 3.88 3.82 2.75C3.82 2.75 4.49 2.54 6.02 3.57C6.66 3.39 7.34 3.3 8.02 3.3C8.7 3.3 9.38 3.39 10.02 3.57C11.55 2.53 12.22 2.75 12.22 2.75C12.66 3.88 12.38 4.72 12.3 4.92C12.81 5.48 13.12 6.18 13.12 7.06C13.12 10.13 11.25 10.81 9.47 11.01C9.76 11.26 10.01 11.74 10.01 12.5C10.01 13.58 10 14.95 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.73 14.53 16.02 11.53 16.02 8C16.02 3.58 12.44 0 8 0Z"
          />
        </svg>
        <span>GitHub 源码</span>
      </a>
    </div>

    <p class="disclaimer">
      免责声明：OSTI 是“自我观察 + 娱乐表达”工具，不可替代临床心理评估与医疗建议。
    </p>
  </section>
</template>

<style scoped>
.btn-github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #0f2d57;
  border: 1px solid #d4e3ff;
  background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
  box-shadow: 0 10px 18px rgba(27, 83, 182, 0.14);
  text-decoration: none;
}

.btn-github:hover {
  border-color: #a8c5f8;
  box-shadow: 0 12px 22px rgba(27, 83, 182, 0.2);
}

.btn-github:focus-visible {
  outline: 3px solid rgba(36, 93, 255, 0.35);
  outline-offset: 2px;
}

.github-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  flex: none;
}
</style>
