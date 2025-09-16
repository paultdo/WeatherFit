import { defineStore } from 'pinia'
import { api } from '@/lib/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchMe() {
      try {
        this.loading = true
        this.error = null
        const { data } = await api.get('/users/me')
        this.user = data.user
        return this.user
      } catch (e) {
        this.user = null
        // ignore 401, set to null
        return null
      } finally {
        this.loading = false
      }
    },
    async login(payload) {
      try {
        this.loading = true
        this.error = null
        const { data } = await api.post('/users/login', payload)
        this.user = data.user
        return this.user
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || 'Login failed'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.loading = false
      }
    },
    async register(payload) {
      try {
        this.loading = true
        this.error = null
        await api.post('/users/register', payload)
        return true
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || 'Registration failed'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        this.loading = true
        await api.post('/users/logout')
      } finally {
        this.user = null
        this.loading = false
      }
    },
  },
})
