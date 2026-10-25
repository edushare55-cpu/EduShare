/**
 * store/ui.store.ts
 *
 * Zustand store for global UI state.
 * Manages sidebar collapse, active class, notification panel, etc.
 */

import { create } from "zustand";

interface UIState {
  isSidebarCollapsed: boolean;
  isNotificationPanelOpen: boolean;
  activeClassId: string | null;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNotificationPanel: () => void;
  setActiveClassId: (classId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  isNotificationPanelOpen: false,
  activeClassId: null,

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) =>
    set({ isSidebarCollapsed: collapsed }),
  toggleNotificationPanel: () =>
    set((state) => ({
      isNotificationPanelOpen: !state.isNotificationPanelOpen,
    })),
  setActiveClassId: (classId) => set({ activeClassId: classId }),
}));
