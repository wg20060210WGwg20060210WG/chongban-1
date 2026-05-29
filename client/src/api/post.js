import request from './index'

export const getPosts = (params) => {
  return request.get('/posts', { params })
}

export const getPostById = (id) => {
  return request.get(`/posts/${id}`)
}

export const createPost = (data) => {
  return request.post('/posts', data)
}

export const updatePost = (id, data) => {
  return request.put(`/posts/${id}`, data)
}

export const deletePost = (id) => {
  return request.delete(`/posts/${id}`)
}

export const uploadImages = (formData) => {
  return request.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
