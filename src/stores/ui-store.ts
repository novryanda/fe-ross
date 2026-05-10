'use client'
import { create } from 'zustand'

interface UIStore {
  modalOpen: string | null
  sidebarOpen: boolean
  openModal: (id: string) => void
  closeModal: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  modalOpen: null,
  sidebarOpen: false,
  openModal: (id) => set({ modalOpen: id }),
  closeModal: () => set({ modalOpen: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
