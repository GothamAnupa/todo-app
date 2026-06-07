import { apiClient } from './api'

const TASKS_PATH = '/tasks'

/**
 * Task API client — mirrors FastAPI task routes.
 */
export const taskService = {
  async getTasks(params = {}) {
    const { data } = await apiClient.get(TASKS_PATH, { params })
    return data
  },

  async getTask(taskId) {
    const { data } = await apiClient.get(`${TASKS_PATH}/${taskId}`)
    return data
  },

  async createTask(payload) {
    const { data } = await apiClient.post(TASKS_PATH, payload)
    return data
  },

  async updateTask(taskId, payload) {
    const { data } = await apiClient.patch(`${TASKS_PATH}/${taskId}`, payload)
    return data
  },

  async completeTask(taskId) {
    const { data } = await apiClient.patch(`${TASKS_PATH}/${taskId}/complete`)
    return data
  },

  async deleteTask(taskId) {
    await apiClient.delete(`${TASKS_PATH}/${taskId}`)
  },

  async markReminded(taskId) {
    const { data } = await apiClient.patch(`${TASKS_PATH}/${taskId}/remind`)
    return data
  },
}
