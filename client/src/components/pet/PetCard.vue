<template>
  <div
    class="pet-card"
    :style="{ animationDelay: `${(index || 0) * 0.08}s` }"
    @click="handleClick"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    :class="{ 'is-hovering': hovering }"
  >
    <div class="card-glow"></div>
    <div class="pet-avatar">
      <img v-if="pet?.avatar" :src="avatarUrl" class="avatar-img" />
      <span v-else class="avatar-emoji">{{ getDefaultAvatar(pet?.species) }}</span>
    </div>
    <div class="pet-info">
      <div class="pet-name-row">
        <h3 class="pet-name">{{ pet?.name || '未命名' }}</h3>
        <span v-if="pet?.gender" class="gender-pill" :class="pet.gender">
          {{ pet.gender === 'male' ? '♂ 公' : '♀ 母' }}
        </span>
      </div>
      <div class="pet-tags">
        <span class="tag species-tag">{{ getSpeciesText(pet?.species) }}</span>
        <span class="tag age-tag" v-if="pet?.age">{{ getAgeText(pet?.age) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  pet: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['click'])
const hovering = ref(false)

const avatarUrl = computed(() => {
  if (!props.pet?.avatar) return ''
  const sep = props.pet.avatar.includes('?') ? '&' : '?'
  return `${props.pet.avatar}${sep}v=${Date.now()}`
})

function handleClick() {
  emit('click', props.pet)
}

function getDefaultAvatar(species) {
  const map = {
    dog: '🐕',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    fish: '🐟',
    hamster: '🐹'
  }
  return map[species] || '🐾'
}

function getSpeciesText(species) {
  const map = {
    dog: '狗',
    cat: '猫',
    rabbit: '兔子',
    bird: '鸟',
    fish: '鱼',
    hamster: '仓鼠',
    other: '其他'
  }
  return map[species] || species || '未知'
}

function getAgeText(age) {
  if (!age) return ''
  if (age < 12) {
    return `${age}个月`
  } else {
    const years = Math.floor(age / 12)
    const months = age % 12
    if (months > 0) {
      return `${years}岁${months}个月`
    }
    return `${years}岁`
  }
}
</script>

<style scoped>
.pet-card {
  position: relative;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  animation: spring-pop 0.6s var(--spring-bounce) both;
  transition: transform 0.45s var(--spring-bounce), box-shadow 0.45s var(--spring-bounce);
}

.pet-card.is-hovering {
  transform: translateY(-10px) scale(1.03);
  box-shadow: var(--shadow-hover);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.08), transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.pet-card.is-hovering .card-glow {
  opacity: 1;
}

.pet-avatar {
  margin-bottom: 14px;
  transition: transform 0.45s var(--spring-bounce);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.avatar-emoji {
  font-size: 42px;
  line-height: 1;
}

.pet-card.is-hovering .pet-avatar {
  transform: scale(1.08);
}

.pet-info {
  width: 100%;
}

.pet-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}

.pet-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.3;
}

.gender-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.gender-pill.male {
  background: rgba(59, 130, 246, 0.12);
  color: #2563EB;
}

.gender-pill.female {
  background: rgba(244, 114, 182, 0.12);
  color: #DB2777;
}

.pet-tags {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.tag {
  padding: 3px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.species-tag {
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

.age-tag {
  background: #FEF3C7;
  color: #92400E;
}
</style>
