import { apiClient } from './api'

const AUTH_PATH = '/auth'

export const authService = {
  async register(payload) {
    const { data } = await apiClient.post(`${AUTH_PATH}/register`, payload)
    return data
  },

  async login(payload) {
    const { data } = await apiClient.post(`${AUTH_PATH}/login`, payload)
    return data
  },

  async getMe() {
    const { data } = await apiClient.get(`${AUTH_PATH}/me`)
    return data
  },
}
