import { create } from 'zustand';
import { appApi } from '@/lib/api/app-api';

export type FocusPanel = 'sidebar' | 'notelist' | 'editor' | 'noteinfo';
export type ViewMode = 'notes' | 'settings';
export type SettingsSection =
  | 'general'
  | 'editor'
  | 'appearance'
  | 'hotkeys'
  | 'about';

interface AppState {
  initialized: boolean;
  vaultPath: string;
  sidebarVisible: boolean;
  noteListVisible: boolean;
  noteInfoVisible: boolean;
  viewMode: ViewMode;
  settingsSection: SettingsSection;
  _savedPanelState: {
    sidebarVisible: boolean;
    noteListVisible: boolean;
    noteInfoVisible: boolean;
  } | null;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  trashOpen: boolean;
  cheatSheetOpen: boolean;
  historyOpen: boolean;
  pendingDeletePath: string | null;
  focusedPanel: FocusPanel;

  init: () => Promise<void>;
  toggleSidebar: () => void;
  toggleNoteList: () => void;
  toggleNoteInfo: () => void;
  enterSettings: () => void;
  exitSettings: () => void;
  setSettingsSection: (section: SettingsSection) => void;
  toggleCommandPalette: () => void;
  toggleSearch: () => void;
  toggleTrash: () => void;
  toggleCheatSheet: () => void;
  toggleHistory: () => void;
  requestDeleteNote: (path: string) => void;
  clearPendingDelete: () => void;
  setFocusedPanel: (panel: FocusPanel) => void;
  focusNextPanel: () => void;
  focusPrevPanel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  initialized: false,
  vaultPath: '',
  sidebarVisible: true,
  noteListVisible: true,
  noteInfoVisible: true,
  viewMode: 'notes',
  settingsSection: 'general',
  _savedPanelState: null,
  commandPaletteOpen: false,
  searchOpen: false,
  trashOpen: false,
  cheatSheetOpen: false,
  historyOpen: false,
  pendingDeletePath: null,
  focusedPanel: 'sidebar',

  init: async () => {
    try {
      const vaultPath = await appApi.initGraphiteDir();
      set({ initialized: true, vaultPath });
    } catch (e) {
      console.error('Failed to initialize:', e);
    }
  },

  toggleSidebar: () =>
    set((s) => {
      if (s.viewMode === 'settings') return s;
      return { sidebarVisible: !s.sidebarVisible };
    }),
  toggleNoteList: () =>
    set((s) => {
      if (s.viewMode === 'settings') return s;
      return { noteListVisible: !s.noteListVisible };
    }),
  toggleNoteInfo: () =>
    set((s) => {
      if (s.viewMode === 'settings') return s;
      return { noteInfoVisible: !s.noteInfoVisible };
    }),
  enterSettings: () =>
    set((s) => ({
      viewMode: 'settings',
      settingsSection:
        s.viewMode === 'settings' ? s.settingsSection : 'general',
      _savedPanelState: {
        sidebarVisible: s.sidebarVisible,
        noteListVisible: s.noteListVisible,
        noteInfoVisible: s.noteInfoVisible,
      },
      sidebarVisible: true,
      noteListVisible: false,
      noteInfoVisible: false,
      focusedPanel: 'sidebar',
    })),
  exitSettings: () =>
    set((s) => ({
      viewMode: 'notes',
      sidebarVisible: s._savedPanelState?.sidebarVisible ?? s.sidebarVisible,
      noteListVisible: s._savedPanelState?.noteListVisible ?? s.noteListVisible,
      noteInfoVisible: s._savedPanelState?.noteInfoVisible ?? s.noteInfoVisible,
      _savedPanelState: null,
    })),
  setSettingsSection: (section) => set({ settingsSection: section }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleTrash: () => set((s) => ({ trashOpen: !s.trashOpen })),
  toggleCheatSheet: () => set((s) => ({ cheatSheetOpen: !s.cheatSheetOpen })),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  requestDeleteNote: (path) => set({ pendingDeletePath: path }),
  clearPendingDelete: () => set({ pendingDeletePath: null }),
  setFocusedPanel: (panel) => set({ focusedPanel: panel }),
  focusNextPanel: () =>
    set((s) => {
      const panels = getVisiblePanels(s);
      const idx = panels.indexOf(s.focusedPanel);
      const next = panels[(idx + 1) % panels.length];
      return { focusedPanel: next };
    }),
  focusPrevPanel: () =>
    set((s) => {
      const panels = getVisiblePanels(s);
      const idx = panels.indexOf(s.focusedPanel);
      const prev = panels[(idx - 1 + panels.length) % panels.length];
      return { focusedPanel: prev };
    }),
}));

function getVisiblePanels(s: {
  sidebarVisible: boolean;
  noteListVisible: boolean;
  noteInfoVisible: boolean;
  viewMode: ViewMode;
}): FocusPanel[] {
  const panels: FocusPanel[] = [];
  if (s.sidebarVisible) panels.push('sidebar');
  if (s.viewMode !== 'settings' && s.noteListVisible) panels.push('notelist');
  panels.push('editor');
  if (s.viewMode !== 'settings' && s.noteInfoVisible) panels.push('noteinfo');
  return panels;
}
