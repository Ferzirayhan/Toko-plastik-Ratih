import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleMobileSidebar: () =>
    set((state) => ({
      mobileSidebarOpen: !state.mobileSidebarOpen,
    })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}))
