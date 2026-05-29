import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyPets } from '../api/pet'

export const usePetStore = defineStore('pet', () => {
  const petList = ref([])
  const currentPet = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const totalPets = ref(0)

  const hasPets = computed(() => totalPets.value > 0)
  const hasFilteredPets = computed(() => petList.value.length > 0)

  async function fetchMyPets(species) {
    loading.value = true
    error.value = null
    if (!species) {
      petList.value = []
    }
    try {
      const res = await getMyPets(species)
      const data = res.data
      if (data && data.list) {
        petList.value = data.list
        if (!species) {
          totalPets.value = data.total ?? data.list.length
        }
      } else if (Array.isArray(data)) {
        petList.value = data
        if (!species) {
          totalPets.value = data.length
        }
      } else {
        petList.value = []
      }
    } catch (err) {
      error.value = err.message || '获取宠物列表失败'
      console.error('获取宠物列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchTotalCount() {
    try {
      const res = await getMyPets()
      const data = res.data
      if (data && data.total !== undefined) {
        totalPets.value = data.total
      } else if (data && data.list) {
        totalPets.value = data.list.length
      } else if (Array.isArray(data)) {
        totalPets.value = data.length
      }
    } catch {
      // silent
    }
  }

  function setCurrentPet(pet) {
    currentPet.value = pet
  }

  function addPetToList(pet) {
    petList.value.push(pet)
  }

  function updatePetInList(petId, petData) {
    const index = petList.value.findIndex(p => p._id === petId)
    if (index !== -1) {
      petList.value[index] = { ...petList.value[index], ...petData }
    }
    if (currentPet.value?._id === petId) {
      currentPet.value = { ...currentPet.value, ...petData }
    }
  }

  function removePetFromList(petId) {
    petList.value = petList.value.filter(p => p._id !== petId)
    if (currentPet.value?._id === petId) {
      currentPet.value = null
    }
  }

  function clearPets() {
    petList.value = []
    currentPet.value = null
    error.value = null
  }

  return {
    petList,
    currentPet,
    loading,
    error,
    totalPets,
    hasPets,
    hasFilteredPets,
    fetchMyPets,
    fetchTotalCount,
    setCurrentPet,
    addPetToList,
    updatePetInList,
    removePetFromList,
    clearPets
  }
})
