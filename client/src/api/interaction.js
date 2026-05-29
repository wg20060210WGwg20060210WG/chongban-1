import request from './index'

export const toggleInteraction = (data) => {
  return request.post('/interactions/toggle', data)
}

export const toggleFollow = (userId) => {
  return request.post('/interactions/follow', { userId })
}

export const checkInteraction = (targetType, targetId) => {
  return request.get(`/interactions/check/${targetType}/${targetId}`)
}
