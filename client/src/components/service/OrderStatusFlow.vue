<template>
  <div class="order-status-flow">
    <div
      v-for="(step, idx) in steps"
      :key="step.key"
      class="flow-step"
      :class="{ active: isReached(step.key), current: current === step.key }"
    >
      <div class="step-dot">
        <svg v-if="isReached(step.key) && current !== step.key" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span v-else class="dot-inner">{{ idx + 1 }}</span>
      </div>
      <span class="step-label">{{ step.label }}</span>
      <div v-if="idx < steps.length - 1" class="step-line" :class="{ filled: isReached(steps[idx + 1].key) }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: String, required: true }
})

const steps = [
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'in_progress', label: '服务中' },
  { key: 'completed', label: '已完成' }
]

const ORDER = ['pending', 'confirmed', 'in_progress', 'completed']

function isReached(key) {
  return ORDER.indexOf(key) <= ORDER.indexOf(props.current)
}
</script>

<style scoped>
.order-status-flow {
  display: flex;
  align-items: flex-start;
  padding: 20px 0;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8e8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.flow-step.active .step-dot {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.flow-step.current .step-dot {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.15);
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.08); }
}

.dot-inner {
  line-height: 1;
}

.step-label {
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
  font-weight: 500;
  text-align: center;
}

.flow-step.active .step-label {
  color: #059669;
  font-weight: 600;
}

.step-line {
  position: absolute;
  top: 16px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 2px;
  background: #e8e8ef;
  transition: background 0.3s;
}

.step-line.filled {
  background: linear-gradient(90deg, #10b981, #059669);
}
</style>