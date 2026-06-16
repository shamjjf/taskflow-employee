import { create } from 'zustand';

interface UIState {
  isTaskModalOpen: boolean;
  isSelfTaskModalOpen: boolean;
  isSidebarCollapsed: boolean;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  openSelfTaskModal: () => void;
  closeSelfTaskModal: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTaskModalOpen: false,
  isSelfTaskModalOpen: false,
  isSidebarCollapsed: false,

  openTaskModal: () => set({ isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false }),
  openSelfTaskModal: () => set({ isSelfTaskModalOpen: true }),
  closeSelfTaskModal: () => set({ isSelfTaskModalOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
