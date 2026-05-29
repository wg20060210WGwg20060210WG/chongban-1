import request from './index'

export const getMyPets = (species) => {
  const params = species ? { species } : {}
  return request.get('/pets/my-pets', { params })
}

export const getPetById = (id) => {
  return request.get(`/pets/${id}/getPetProfile`)
}

export const addPet = (data) => {
  return request.post('/pets/createPetProfile', data)
}

export const updatePet = (id, data) => {
  return request.put(`/pets/${id}/updatePetProfile`, data)
}

export const deletePet = (id) => {
  return request.delete(`/pets/${id}/deletePetProfile`)
}

export const addHealthRecord = (petId, data) => {
  return request.post(`/pets/${petId}/health-record`, data)
}

export const deleteHealthRecord = (petId, type, recordId) => {
  return request.delete(`/pets/${petId}/health-record/${type}/${recordId}`)
}

export const getHealthReminders = (days = 30) => {
  return request.get('/pets/health-reminders', { params: { days } })
}

export const uploadPetAvatar = (petId, formData) => {
  return request.post(`/pets/${petId}/upload-avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const uploadPetPhotos = (petId, formData) => {
  return request.post(`/pets/${petId}/upload-photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const deletePetPhoto = (petId, photoUrl) => {
  return request.delete(`/pets/${petId}/delete-photo`, {
    data: { photoUrl }
  })
}
