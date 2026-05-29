import request from './index'

/**
 * 登录
 * @param {Object} data - 登录信息
 * @param {string} data.account - 账号（用户名/邮箱/手机号）
 * @param {string} data.password - 密码
 */
export const login = (data) => {
  return request.post('/auth/login', data)
}

/**
 * 注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {string} [data.phone] - 手机号（可选）
 */
export const register = (data) => {
  return request.post('/auth/register', data)
}

/**
 * 检查用户名/邮箱是否已注册
 * @param {Object} data - 检查信息
 * @param {string} [data.username] - 用户名
 * @param {string} [data.email] - 邮箱
 * @param {string} [data.phone] - 手机号
 */
export const checkDuplicate = (data) => {
  return request.post('/auth/check-duplicate', data)
}
