import request from './index'

export const createComment = (data) => {
  return request.post('/comments', data)
}

export const getPostComments = (postId, params) => {
  return request.get(`/comments/post/${postId}`, { params })
}

export const deleteComment = (id) => {
  return request.delete(`/comments/${id}`)
}
