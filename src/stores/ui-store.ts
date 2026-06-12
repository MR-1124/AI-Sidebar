// ─────────────────────────────────────────────────────────────
// UI Store — Ephemeral UI state (not persisted)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';

export type View = 'chat' | 'settings' | 'analytics' | 'onboarding';
export type SettingsTab = 'general' | 'providers' | 'tools' | 'models' | 'prompts' | 'chat' | 'privacy' | 'export' | 'shortcuts' | 'personas';

interface UIState {
  // ── Navigation ───────────────────────────────────
  currentView: View;
  settingsTab: SettingsTab;

  // ── Sidebar ──────────────────────────────────────
  sidebarOpen: boolean;
  sidebarWidth: number;
  settingsSidebarCollapsed: boolean;

  // ── Modals / Dialogs ─────────────────────────────
  modelSelectorOpen: boolean;
  searchOpen: boolean;
  exportDialogOpen: boolean;
  deleteDialogOpen: boolean;
  deleteTarget: string | null;

  // ── Chat UI ──────────────────────────────────────
  isGenerating: boolean;
  activeRequestId: string | null;
  editingMessageId: string | null;
  searchInChatQuery: string;
  includePageContext: boolean;
  webSearchEnabled: boolean;

  // ── Actions ──────────────────────────────────────
  setView: (view: View) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleSettingsSidebar: () => void;
  setModelSelectorOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setDeleteDialog: (open: boolean, target?: string | null) => void;
  setGenerating: (generating: boolean, requestId?: string | null) => void;
  setEditingMessageId: (id: string | null) => void;
  setSearchInChatQuery: (query: string) => void;
  setIncludePageContext: (include: boolean) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'chat',
  settingsTab: 'general',
  sidebarOpen: false,
  sidebarWidth: 280,
  settingsSidebarCollapsed: false,
  modelSelectorOpen: false,
  searchOpen: false,
  exportDialogOpen: false,
  deleteDialogOpen: false,
  deleteTarget: null,
  isGenerating: false,
  activeRequestId: null,
  editingMessageId: null,
  searchInChatQuery: '',
  includePageContext: false,
  webSearchEnabled: false,

  setView: (view) => set({ currentView: view }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleSettingsSidebar: () => set((s) => ({ settingsSidebarCollapsed: !s.settingsSidebarCollapsed })),
  setModelSelectorOpen: (open) => set({ modelSelectorOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
  setDeleteDialog: (open, target = null) => set({ deleteDialogOpen: open, deleteTarget: target }),
  setGenerating: (generating, requestId = null) =>
    set({ isGenerating: generating, activeRequestId: requestId }),
  setEditingMessageId: (id) => set({ editingMessageId: id }),
  setSearchInChatQuery: (query) => set({ searchInChatQuery: query }),
  setIncludePageContext: (include) => set({ includePageContext: include }),
  setWebSearchEnabled: (enabled) => set({ webSearchEnabled: enabled }),
}));
