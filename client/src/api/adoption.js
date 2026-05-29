import request from './index'

// 获取领养列表（公开）
export const getAdoptions = (params) => {
  return request.get('/adoptions/getAdoptions', { params })
}

// 获取领养详情（公开）
export const getAdoptionDetail = (id) => {
  return request.get(`/adoptions/${id}/getAdoptionDetail`)
}

// 发布领养信息
export const createAdoption = (data) => {
  return request.post('/adoptions/createAdoption', data)
}

// 获取我发布的领养列表
export const getMyAdoptions = (params) => {
  return request.get('/adoptions/my/getMyAdoptions', { params })
}

// 更新领养信息
export const updateAdoption = (id, data) => {
  return request.put(`/adoptions/${id}/updateAdoption`, data)
}

// 关闭/删除领养信息
export const deleteAdoption = (id) => {
  return request.delete(`/adoptions/${id}/deleteAdoption`)
}

// 提交领养申请
export const applyAdoption = (id, data) => {
  return request.post(`/adoptions/${id}/applyAdoption`, data)
}

// 获取我的领养申请
export const getMyApplications = (params) => {
  return request.get('/adoptions/applications/my/getMyApplications', { params })
}

// 获取某个领养的所有申请（发布者查看）
export const getAdoptionApplications = (id, params) => {
  return request.get(`/adoptions/${id}/applications/getAdoptionApplications`, { params })
}

// 审核领养申请
export const reviewApplication = (id, data) => {
  return request.put(`/adoptions/applications/${id}/reviewApplication`, data)
}

// 取消领养申请
export const cancelApplication = (id) => {
  return request.put(`/adoptions/applications/${id}/cancelApplication`)
}

// 添加回访记录
export const addFollowUp = (id, data) => {
  return request.post(`/adoptions/applications/${id}/addFollowUp`, data)
}