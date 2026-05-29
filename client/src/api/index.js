import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'
import storage from '../utils/storage'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    const token = storage.get(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.success) {
      return data
    }

    const message = data.error?.message || data.message || '请求失败'
    return Promise.reject(new Error(message))
  },
  (error) => {
    let errorMessage = '请求失败，请稍后再试'

    if (error.response) {
      const { status, data } = error.response
      const requestConfig = error.config

      errorMessage = data?.error?.message || data?.message || `请求失败 (${status})`

      const isAuthEndpoint = requestConfig?.url?.includes('/auth/')

      if (status === 401 && !isAuthEndpoint) {
        storage.clear()
        window.location.href = '/login'
      } else if (status === 403) {
        errorMessage = data?.error?.message || '没有权限访问'
      } else if (status >= 500) {
        errorMessage = data?.error?.message || data?.message || '服务器错误，请稍后再试'
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络'
    } else {
      errorMessage = error.message || '请求配置错误'
    }

    return Promise.reject(new Error(errorMessage))
  }
)

export default request
