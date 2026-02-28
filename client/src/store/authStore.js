// src/store/authStore.js
import { create } from 'zustand'
import api from '../api/axios'

const storedUser = localStorage.getItem('pos_user')
const storedToken = localStorage.getItem('pos_token')

const useAuthStore = create((set) => ({
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            const { data } = await api.post('/auth/login', { email, password })
            const { token, user } = data.data
            localStorage.setItem('pos_token', token)
            localStorage.setItem('pos_user', JSON.stringify(user))
            set({ token, user, isLoading: false })
            return { success: true }
        } catch (err) {
            const message = err.response?.data?.error?.message || 'Login failed'
            set({ isLoading: false, error: message })
            return { success: false, error: message }
        }
    },

    logout: () => {
        localStorage.removeItem('pos_token')
        localStorage.removeItem('pos_user')
        set({ token: null, user: null, error: null })
    },

    clearError: () => set({ error: null }),
}))

export default useAuthStore
