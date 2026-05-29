<template>
  <div class="pet-page">
    <div class="page-header">
      <h1>我的宠物</h1>
      <n-button type="primary" strong @click="goToAddPet" class="add-btn">
        <template #icon>
          <span>+</span>
        </template>
        添加宠物
      </n-button>
    </div>

    <div class="filter-bar" v-if="petStore.hasPets || currentSpecies">
      <n-space>
        <n-tag
          v-for="opt in speciesFilterOptions"
          :key="opt.value"
          :bordered="false"
          :type="currentSpecies === opt.value ? 'primary' : 'default'"
          checkable
          :checked="currentSpecies === opt.value"
          @update:checked="handleSpeciesFilter(opt.value)"
        >
          {{ opt.label }}
        </n-tag>
      </n-space>
    </div>

    <n-spin :show="petStore.loading" style="min-height: 200px;">
      <div v-if="petStore.hasFilteredPets" class="pet-grid">
        <PetCard
          v-for="(pet, index) in petStore.petList"
          :key="pet._id"
          :pet="pet"
          :index="index"
          @click="goToPetDetail(pet)"
        />
        <div class="add-card" @click="goToAddPet">
          <div class="add-icon">+</div>
          <div class="add-text">添加宠物</div>
        </div>
      </div>

      <div v-else-if="currentSpecies && petStore.hasPets" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>暂无该种类的宠物</h3>
        <p>您还没有添加{{ getSpeciesLabel(currentSpecies) }}类型的宠物</p>
        <n-space>
          <n-button strong size="large" @click="clearFilter">
            查看全部
          </n-button>
          <n-button type="primary" strong size="large" @click="goToAddPet">
            添加宠物
          </n-button>
        </n-space>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🐾</div>
        <h3>还没有宠物</h3>
        <p>添加您的第一个毛孩子吧！</p>
        <n-button type="primary" strong size="large" @click="goToAddPet">
          添加宠物
        </n-button>
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePetStore } from '../../stores/pet'
import { useMessage } from 'naive-ui'
import PetCard from '../../components/pet/PetCard.vue'

const router = useRouter()
const message = useMessage()
const petStore = usePetStore()

const currentSpecies = ref('')

const speciesFilterOptions = [
  { label: '全部', value: '' },
  { label: '🐕 狗', value: 'dog' },
  { label: '🐱 猫', value: 'cat' },
  { label: '🐰 兔子', value: 'rabbit' },
  { label: '🐦 鸟', value: 'bird' },
  { label: '🐟 鱼', value: 'fish' },
  { label: '🐹 仓鼠', value: 'hamster' }
]

onMounted(() => {
  loadPets()
})

async function loadPets() {
  try {
    await petStore.fetchMyPets(currentSpecies.value)
    if (currentSpecies.value && !petStore.totalPets) {
      await petStore.fetchTotalCount()
    }
  } catch (error) {
    console.error('加载宠物列表失败:', error)
    message.error(error.message || '加载失败')
  }
}

function handleSpeciesFilter(species) {
  currentSpecies.value = species
  loadPets()
}

function clearFilter() {
  currentSpecies.value = ''
  loadPets()
}

function getSpeciesLabel(species) {
  const opt = speciesFilterOptions.find(o => o.value === species)
  return opt ? opt.label.replace(/[^\u4e00-\u9fa5]/g, '') : species
}

function goToAddPet() {
  router.push('/pets/add')
}

function goToPetDetail(pet) {
  petStore.setCurrentPet(pet)
  router.push(`/pets/${pet._id}`)
}
</script>

<style scoped>
.pet-page {
  padding: 8px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.add-btn {
  background: linear-gradient(135deg, #10B981, #059669);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.filter-bar {
  margin-bottom: 20px;
  padding: 14px 18px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  animation: spring-slide-up 0.5s var(--spring-soft) both;
}

.filter-bar :deep(.n-tag) {
  border-radius: var(--radius-full) !important;
  padding: 0 14px;
  height: 32px;
  font-size: 13px;
  transition: all var(--transition-normal);
}

.filter-bar :deep(.n-tag:hover) {
  transform: translateY(-1px);
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.add-card {
  background: #f9fafb;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.45s var(--spring-bounce), box-shadow 0.45s var(--spring-bounce), border-color 0.3s, background 0.3s;
  min-height: 200px;
  animation: spring-pop 0.6s var(--spring-bounce) both;
  animation-delay: 0.3s;
}

.add-card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.add-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: transform 0.4s var(--spring-bounce);
}

.add-card:hover .add-icon {
  transform: scale(1.15) rotate(90deg);
}

.add-text {
  color: var(--color-primary-dark);
  font-weight: 600;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .pet-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
