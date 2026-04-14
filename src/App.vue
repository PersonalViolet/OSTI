<template>
  <main class="page">
    <router-view />
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

.result-illustration {
  margin: 14px auto 0;
  width: fit-content;
  border: 1px solid #d8e6ff;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(35, 76, 144, 0.12);
}

.result-illustration img {
  width: 168px;
  height: 168px;
  display: block;
  object-fit: contain;
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

.poster-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(14, 31, 62, 0.58);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.poster-modal {
  width: min(92vw, 520px);
  max-height: calc(100dvh - 32px);
  overflow: auto;
  border-radius: 20px;
  border: 1px solid #ccddff;
  background: linear-gradient(168deg, #eef5ff 0%, #e5efff 54%, #f5f9ff 100%);
  box-shadow: 0 22px 52px rgba(17, 39, 76, 0.32);
  padding: 14px;
}

.poster-modal-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.poster-modal-title {
  color: #1e4b95;
  font-weight: 800;
}

.poster-modal-subtitle {
  margin-top: 4px;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #5b7495;
}

.poster-close-btn {
  border-radius: 10px;
  border: 1px solid #cddfff;
  background: #fff;
  color: #2a5aa9;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 10px;
  cursor: pointer;
}

.poster-close-btn:hover {
  background: #f4f8ff;
}

.poster-modal-body {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.poster-modal-body img {
  width: min(100%, 360px);
  border-radius: 14px;
  display: block;
  background: #fff;
  border: 1px solid #d8e7ff;
  box-shadow: 0 12px 26px rgba(19, 42, 83, 0.2);
}

.poster-modal-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

  .result-illustration img {
    width: 128px;
    height: 128px;
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

  .poster-modal-actions {
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
