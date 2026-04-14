<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { PERSONA_LIBRARY, SPECIAL_PERSONAS } from '@/data/osti-data'
import { getPersonaIllustration } from '@/lib/persona-illustration'
import type { PersonaProfile } from '@/types/osti'

type PersonaEntry = {
  profile: PersonaProfile
  source: 'regular' | 'special'
}

const router = useRouter()
const selectedCode = ref<string | null>(null)

const personaEntries = computed<PersonaEntry[]>(() => {
  const regular = PERSONA_LIBRARY.map((profile) => ({
    profile,
    source: 'regular' as const,
  }))

  const special = Object.values(SPECIAL_PERSONAS).map((profile) => ({
    profile,
    source: 'special' as const,
  }))

  return [...regular, ...special]
})

const selectedPersona = computed(() => {
  if (!selectedCode.value) {
    return null
  }

  return personaEntries.value.find((entry) => entry.profile.code === selectedCode.value) ?? null
})

const selectedDescription = computed(() => {
  const raw = selectedPersona.value?.profile.description.trim() ?? ''
  const systemToken = '系统特色：'
  const lifeToken = '生活映照：'

  if (!raw.includes(systemToken) || !raw.includes(lifeToken)) {
    return {
      system: raw,
      life: '',
    }
  }

  const [systemChunk = '', lifeChunk = ''] = raw.split(lifeToken)

  return {
    system: systemChunk.replace(systemToken, '').trim(),
    life: lifeChunk.trim(),
  }
})

function openDetail(code: string): void {
  selectedCode.value = code
}

function closeDetail(): void {
  selectedCode.value = null
}

function backHome(): void {
  void router.push('/')
}

function startQuiz(): void {
  void router.push('/quiz')
}

function getFamilyToneClass(osFamily: PersonaProfile['osFamily']): string {
  if (osFamily === 'Special') {
    return 'tone-special'
  }

  if (osFamily === 'Linux' || osFamily === 'BSD') {
    return 'tone-deep'
  }

  if (osFamily === 'iOS' || osFamily === 'macOS') {
    return 'tone-clean'
  }

  if (osFamily === 'Windows' || osFamily === 'HarmonyOS') {
    return 'tone-pro'
  }

  return 'tone-agile'
}

function getPersonaSvg(osFamily: PersonaProfile['osFamily']): string | null {
  return getPersonaIllustration(osFamily)
}

function handleKeyboard(event: KeyboardEvent): void {
  if (event.key === 'Escape' && selectedCode.value) {
    closeDetail()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboard)
})
</script>

<template>
  <section class="panel persona-atlas fade-in">
    <header class="atlas-head">
      <p class="eyebrow">Persona Atlas</p>
      <h1>OSTI 人格图鉴</h1>
      <p class="lead">
        这里收录常规人格与隐藏人格，先看全貌，再点卡片进入细节。
      </p>

      <div class="atlas-meta-row">
        <span class="atlas-chip">共 {{ personaEntries.length }} 个人格</span>
        <span class="atlas-chip">卡片可点击查看详情</span>
      </div>

      <div class="atlas-actions">
        <button class="btn btn-ghost" type="button" @click="backHome">返回首页</button>
        <button class="btn btn-primary" type="button" @click="startQuiz">立即测验</button>
      </div>
    </header>

    <div class="atlas-grid">
      <button
        v-for="entry in personaEntries"
        :key="entry.profile.code"
        class="atlas-card"
        :class="getFamilyToneClass(entry.profile.osFamily)"
        type="button"
        @click="openDetail(entry.profile.code)"
      >
        <div class="atlas-card-top">
          <span class="source-pill" :class="entry.source === 'special' ? 'pill-special' : 'pill-regular'">
            {{ entry.source === 'special' ? '隐藏人格' : '常规人格' }}
          </span>
          <span class="family-pill">{{ entry.profile.osFamily }}</span>
        </div>

        <div v-if="getPersonaSvg(entry.profile.osFamily)" class="atlas-figure">
          <img :src="getPersonaSvg(entry.profile.osFamily) ?? ''" :alt="`${entry.profile.osFamily} 人格图`" loading="lazy">
        </div>

        <h3>{{ entry.profile.name }}</h3>
        <p class="atlas-tagline">{{ entry.profile.tagline }}</p>

        <div class="atlas-strengths">
          <span v-for="point in entry.profile.strengths.slice(0, 2)" :key="point">{{ point }}</span>
        </div>

        <p class="atlas-open-tip">点击查看详情</p>
      </button>
    </div>
  </section>

  <div
    v-if="selectedPersona"
    class="atlas-modal-mask"
    role="dialog"
    aria-modal="true"
    aria-label="人格详情"
    @click.self="closeDetail"
  >
    <article class="atlas-modal">
      <header class="atlas-modal-head">
        <div>
          <p class="source-caption">{{ selectedPersona.source === 'special' ? '隐藏人格' : '常规人格' }}</p>
          <h2>{{ selectedPersona.profile.name }}</h2>
          <p>{{ selectedPersona.profile.osFamily }} · {{ selectedPersona.profile.code }}</p>
        </div>
        <button class="close-detail-btn" type="button" @click="closeDetail">关闭</button>
      </header>

      <div v-if="getPersonaSvg(selectedPersona.profile.osFamily)" class="atlas-detail-hero">
        <img :src="getPersonaSvg(selectedPersona.profile.osFamily) ?? ''" :alt="`${selectedPersona.profile.osFamily} 人格图`" loading="lazy">
      </div>

      <article class="atlas-detail-block">
        <h3>系统特色</h3>
        <p>{{ selectedDescription.system }}</p>
      </article>

      <article v-if="selectedDescription.life" class="atlas-detail-block">
        <h3>生活映照</h3>
        <p>{{ selectedDescription.life }}</p>
      </article>

      <p class="atlas-meme">“{{ selectedPersona.profile.memeLine }}”</p>

      <div class="atlas-detail-grid">
        <section>
          <h4>优势</h4>
          <ul>
            <li v-for="item in selectedPersona.profile.strengths" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section>
          <h4>盲点</h4>
          <ul>
            <li v-for="item in selectedPersona.profile.blindSpots" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section>
          <h4>建议</h4>
          <ul>
            <li v-for="item in selectedPersona.profile.recommendations" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>
    </article>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,600;6..96,700&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.persona-atlas {
  display: grid;
  gap: 22px;
}

.atlas-head h1 {
  margin-top: 8px;
  font-size: clamp(2rem, 5vw, 3.2rem);
  letter-spacing: 0.01em;
  font-family: 'Bodoni Moda', 'Noto Serif SC', serif;
  color: #11346a;
}

.atlas-meta-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.atlas-chip {
  border: 1px solid #d6e6ff;
  border-radius: 999px;
  padding: 7px 12px;
  background: #f4f9ff;
  color: #2e598f;
  font-size: 0.88rem;
}

.atlas-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.atlas-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.atlas-card {
  border: 1px solid #d6e6ff;
  border-radius: 18px;
  background: linear-gradient(165deg, #ffffff 0%, #f3f8ff 76%);
  padding: 14px;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
  display: grid;
  gap: 10px;
  min-height: 230px;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.atlas-card:hover {
  transform: translateY(-3px);
  border-color: #92b5ff;
  box-shadow: 0 16px 28px rgba(22, 63, 128, 0.15);
}

.atlas-figure {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 72px;
  border: 1px solid #dbe8ff;
  border-radius: 12px;
  background: linear-gradient(165deg, #ffffff 0%, #f2f8ff 100%);
}

.atlas-figure img {
  width: 70px;
  height: 70px;
  object-fit: contain;
}

.atlas-card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.source-pill,
.family-pill {
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 0.74rem;
  font-weight: 700;
}

.pill-regular {
  background: #e9f3ff;
  color: #2f5d97;
}

.pill-special {
  background: #e7efff;
  color: #203f7d;
}

.family-pill {
  border: 1px solid #cfe0ff;
  color: #325f9a;
  background: #fff;
}

.atlas-card h3 {
  font-size: 1.28rem;
  font-family: 'Bodoni Moda', 'Noto Serif SC', serif;
  color: #163a73;
}

.atlas-tagline {
  color: #5b7390;
  line-height: 1.5;
  font-size: 0.92rem;
}

.atlas-strengths {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.atlas-strengths span {
  border: 1px dashed #bfd6ff;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.78rem;
  color: #49698c;
  background: rgba(243, 249, 255, 0.9);
}

.atlas-open-tip {
  margin-top: auto;
  color: #2a5aa8;
  font-weight: 700;
  font-size: 0.84rem;
}

.tone-special {
  background: linear-gradient(165deg, #f6f9ff 0%, #e7f0ff 100%);
}

.tone-deep {
  background: linear-gradient(168deg, #f7fbff 0%, #eef5ff 55%, #e7f0ff 100%);
}

.tone-clean {
  background: linear-gradient(162deg, #ffffff 0%, #f3f8ff 78%);
}

.tone-pro {
  background: linear-gradient(162deg, #fdfefe 0%, #eef4ff 76%);
}

.tone-agile {
  background: linear-gradient(162deg, #ffffff 0%, #edf6ff 75%);
}

.atlas-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 48;
  background: rgba(11, 25, 52, 0.62);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.atlas-modal {
  width: min(960px, 94vw);
  max-height: calc(100dvh - 32px);
  overflow: auto;
  border-radius: 24px;
  border: 1px solid #d2e2ff;
  background: linear-gradient(166deg, #f5f9ff 0%, #edf4ff 52%, #f8fbff 100%);
  box-shadow: 0 24px 48px rgba(10, 30, 66, 0.3);
  padding: 20px;
  display: grid;
  gap: 12px;
}

.atlas-modal-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.source-caption {
  color: #4f6f95;
  font-size: 0.86rem;
}

.atlas-modal-head h2 {
  margin-top: 4px;
  font-family: 'Bodoni Moda', 'Noto Serif SC', serif;
  font-size: clamp(1.5rem, 4.2vw, 2.1rem);
  color: #14396f;
}

.atlas-modal-head p {
  margin-top: 4px;
  color: #5f7894;
}

.close-detail-btn {
  border: 1px solid #cbdfff;
  border-radius: 12px;
  background: #fff;
  color: #2d5ea5;
  font-weight: 700;
  padding: 8px 12px;
  cursor: pointer;
}

.atlas-detail-block {
  border: 1px solid #d8e6ff;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
}

.atlas-detail-hero {
  border: 1px solid #d8e6ff;
  border-radius: 14px;
  background: #fff;
  padding: 10px;
  display: flex;
  justify-content: center;
}

.atlas-detail-hero img {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

.atlas-detail-block h3 {
  font-size: 1rem;
  color: #1f4d91;
  margin-bottom: 6px;
}

.atlas-detail-block p {
  color: #5a7594;
  line-height: 1.64;
}

.atlas-meme {
  color: #3d6192;
  font-weight: 600;
}

.atlas-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.atlas-detail-grid section {
  border: 1px solid #d8e6ff;
  border-radius: 14px;
  background: #fff;
  padding: 12px;
}

.atlas-detail-grid h4 {
  margin: 0 0 8px;
  color: #1f4f92;
}

.atlas-detail-grid ul {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 6px;
  color: #5a7594;
  line-height: 1.5;
}

@media (max-width: 1000px) {
  .atlas-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .atlas-grid,
  .atlas-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .atlas-actions {
    flex-direction: column;
  }

  .atlas-grid,
  .atlas-detail-grid {
    grid-template-columns: 1fr;
  }

  .atlas-modal {
    padding: 14px;
    border-radius: 16px;
  }

  .atlas-modal-head {
    flex-direction: column;
  }

  .close-detail-btn {
    width: 100%;
  }
}
</style>
