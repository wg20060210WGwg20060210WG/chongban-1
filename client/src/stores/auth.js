import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '../utils/constants'
import storage from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(storage.get(STORAGE_KEYS.TOKEN))
  const userInfo = ref(storage.get(STORAGE_KEYS.USER_INFO))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(newToken, newUserInfo) {
    token.value = newToken
    userInfo.value = newUserInfo
    storage.set(STORAGE_KEYS.TOKEN, newToken)
    storage.set(STORAGE_KEYS.USER_INFO, newUserInfo)
  }

  function setUserInfo(newUserInfo) {
    userInfo.value = newUserInfo
    storage.set(STORAGE_KEYS.USER_INFO, newUserInfo)
  }

  function clearAuth() {
    token.value = null
    userInfo.value = null
    storage.clear()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setAuth,
    setUserInfo,
    clearAuth
  }
})
