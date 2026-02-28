// src/store/settingsStore.js
import { create } from 'zustand'
import api from '../api/axios'

const useSettingsStore = create((set) => ({
    settings: {},
    isLoaded: false,

    fetchSettings: async () => {
        try {
            const { data } = await api.get('/settings')
            set({ settings: data.data, isLoaded: true })
        } catch (err) {
            console.error('Failed to fetch settings', err)
        }
    },

    updateSetting: async (key, value) => {
        try {
            await api.put(`/settings/${key}`, { value })
            set((state) => ({ settings: { ...state.settings, [key]: value } }))
            return { success: true }
        } catch (err) {
            return { success: false, error: err.response?.data?.error?.message || 'Failed to update setting' }
        }
    },
}))

export default useSettingsStore
