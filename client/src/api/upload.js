import request from './index'

/**
 * 上传单张图片
 * @param {File} file - 图片文件
 * @param {Function} onProgress - 上传进度回调 (0-100)
 * @returns {Promise<{url: string, filename: string, size: number}>}
 */
export const uploadImage = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
  })
}

/**
 * 批量上传图片
 * @param {File[]} files - 图片文件数组
 * @param {Function} onProgress - 上传进度回调 (0-100)
 * @returns {Promise<{urls: string[]}>}
 */
export const uploadImages = (files, onProgress) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return request.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
  })
}