import { io } from 'socket.io-client'
import { STORAGE_KEYS } from './constants'
import storage from './storage'

let socket = null

export function initSocket() {
  if (socket) return socket

  const token = storage.get(STORAGE_KEYS.TOKEN)

  socket = io('http://localhost:3000', {
    autoConnect: false
  })

  socket.on('connect', () => {
    if (token) {
      socket.emit('authenticate', { token })
    }
  })

  socket.on('authenticated', (data) => {
    console.log('Socket authenticated:', data.userId)
  })

  socket.on('auth_error', (data) => {
    console.error('Socket auth error:', data.message)
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    socket = initSocket()
  }
  return socket
}

export function connectSocket() {
  if (!socket) {
    socket = initSocket()
  }
  socket.connect()
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function emitSocket(event, data) {
  if (socket) {
    socket.emit(event, data)
  }
}

export function onSocket(event, callback) {
  if (socket) {
    socket.on(event, callback)
  }
}

export function offSocket(event, callback) {
  if (socket) {
    socket.off(event, callback)
  }
}
