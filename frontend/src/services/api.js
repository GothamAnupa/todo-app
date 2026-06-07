import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

/**
 * Map Axios/HTTP failures to user-friendly messages.
 */
export function getErrorMessage(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.'
    }
    return `Unable to reach the server. Is the backend running at ${API_BASE_URL}?`
  }

  const { status, data } = error.response

  if (typeof data?.detail === 'string') return data.detail

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item?.msg ?? item?.loc?.join('.') ?? 'Validation error')
      .join(', ')
  }

  const statusMessages = {
    400: 'Invalid request. Please review your input.',
    401: 'Please sign in to continue.',
    404: 'The requested resource was not found.',
    409: 'This account already exists.',
    422: 'Validation failed. Please fix the highlighted fields.',
    500: 'Server error. Please try again later.',
  }

  return statusMessages[status] ?? `Request failed (${status})`
}

/**
 * Shared Axios instance for all API calls.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }

    const message = getErrorMessage(error)
    const enhanced = new Error(message)
    enhanced.status = error.response?.status ?? null
    enhanced.field = error.response?.data?.field ?? null
    enhanced.isNetworkError = !error.response
    enhanced.original = error
    return Promise.reject(enhanced)
  },
)

export { API_BASE_URL }
