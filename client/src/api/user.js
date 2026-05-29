import request from './index'

export const getProfile = () => {
  return request.get('/users/profile')
}

export const updateProfile = (data) => {
  return request.put('/users/profile', data)
}

export const changePassword = (data) => {
  return request.put('/users/password', data)
}

export const uploadAvatar = (formData) => {
  return request.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
