const storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      if (!value) return defaultValue
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chongban_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}

export default storage
