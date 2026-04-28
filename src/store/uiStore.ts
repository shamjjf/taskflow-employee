import { create } from 'zustand';

interface UIState {
  isTaskModalOpen: boolean;
  isSidebarCollapsed: boolean;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTaskModalOpen: false,
  isSidebarCollapsed: false,

  openTaskModal: () => set({ isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
