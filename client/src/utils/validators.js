export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validatePhone(phone) {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

export function validatePassword(password) {
  if (!password || password.length < 6) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  return hasLetter && hasNumber
}

export function validateUsername(username) {
  return username?.length >= 3 && username?.length <= 30
}

export function validateRequired(value) {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined && value !== ''
}

export function validateImage(file) {
  if (!file) {
    return { valid: false, message: '请选择文件' }
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '仅支持 JPG/PNG/GIF/WEBP 格式' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, message: '文件大小不能超过 5MB' }
  }
  return { valid: true }
}
