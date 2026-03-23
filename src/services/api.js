/**
 * NeuroLearn AI — Centralized API Service
 * Axios instance pointing to the FastAPI backend at http://localhost:8000.
 * Automatically injects the JWT auth token if present in localStorage.
 */
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor — inject auth token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neurolearn_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor — handle 401 ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neurolearn_token')
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
}

// ─── Study Plan ───────────────────────────────────────────────────────────

export const studyPlanAPI = {
  getHistory: (userId = 'demo-user-001') => api.get('/api/study-plan/history', { params: { user_id: userId } }),
  generate: (data) => api.post('/api/study-plan/generate', data),
}


// ─── Doubt Solver ─────────────────────────────────────────────────────────

export const doubtAPI = {
  solve: (question, subject = null) =>
    api.post('/api/doubt/solve', { question, subject }),
  getTopics: () => api.get('/api/doubt/topics'),
}

// ─── Questions ────────────────────────────────────────────────────────────

export const questionsAPI = {
  get: (params = {}) => api.get('/api/questions', { params }),
  getNext: (userId = 'demo-user-001', subject = '', topic = '', difficulty = '') => api.get('/api/questions/next', { params: { user_id: userId, ...(subject && {subject}), ...(topic && {topic}), ...(difficulty && {difficulty}) } }),
  submit: (data) => api.post('/api/questions/submit', data),
  getTopics: () => api.get('/api/questions/topics'),
}

// ─── Analytics ────────────────────────────────────────────────────────────

export const analyticsAPI = {
  getSummary: (userId = 'demo-user-001') =>
    api.get('/api/analytics/summary', { params: { user_id: userId } }),
  getAccuracyTrend: (userId = 'demo-user-001', weeks = 8) =>
    api.get('/api/analytics/accuracy-trend', { params: { user_id: userId, weeks } }),
  getTopicBreakdown: (userId = 'demo-user-001') =>
    api.get('/api/analytics/topic-breakdown', { params: { user_id: userId } }),
  getSpeedTrend: (userId = 'demo-user-001') =>
    api.get('/api/analytics/speed-trend', { params: { user_id: userId } }),
  getRadar: (userId = 'demo-user-001') =>
    api.get('/api/analytics/radar', { params: { user_id: userId } }),
  getWeakAreas: (userId = 'demo-user-001') =>
    api.get('/api/analytics/weak-areas', { params: { user_id: userId } }),
  recordAttempt: (data) => api.post('/api/analytics/record', data),
}

// ─── Rank Predictor ───────────────────────────────────────────────────────

export const rankAPI = {
  predict: (data) => api.post('/api/rank/predict', data),
  getLeaderboard: (userId = 'demo-user-001') =>
    api.get('/api/rank/leaderboard', { params: { user_id: userId } }),
}

// ─── Health Check ─────────────────────────────────────────────────────────

export const checkBackend = () => api.get('/health').then(() => true).catch(() => false)

export default api
