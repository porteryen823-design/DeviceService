import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5200'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }

    // Transform error for consistent error handling
    let errorMessage = '無法獲取代理狀態資料'

    if (error.response?.data) {
      // 如果後端返回結構化的錯誤訊息
      if (typeof error.response.data === 'object' && error.response.data.detail) {
        errorMessage = error.response.data.detail
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data
      }
    } else if (error.message) {
      // 網路錯誤或其他錯誤
      if (error.code === 'ECONNREFUSED') {
        errorMessage = '無法連接到伺服器，請檢查伺服器是否運行'
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '請求超時，請稍後再試'
      } else {
        errorMessage = `網路錯誤: ${error.message}`
      }
    }

    return Promise.reject(new Error(errorMessage))
  }
)