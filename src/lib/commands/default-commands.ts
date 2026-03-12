import { zoomApi } from '@/lib/api/zoom-api';
import { useAppStore } from '@/stores/app-store';
import { useHistoryStore } from '@/stores/history-store';
import { useNoteStore } from '@/stores/note-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { commandRegistry } from './registry';

const ZOOM_LEVELS = [0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

export function setupDefaultCommands() {
  commandRegistry.register({
    id: 'note:create',
    name: 'commands.createNote',
    hotkey: 'Mod+N',
    execute: () => useNoteStore.getState().createNote(),
  });

  commandRegistry.register({
    id: 'folder:create',
    name: 'commands.createFolder',
    hotkey: 'Mod+Shift+N',
    execute: () => {
      const app = useAppStore.getState();
      // Ensure sidebar is visible so FolderTree is mounted
      if (!app.sidebarVisible) {
        app.toggleSidebar();
      }
      useSidebarStore.getState().setSection('folders');
      // Allow component to mount before dispatching
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('graphite:create-folder'));
      });
    },
  });

  commandRegistry.register({
    id: 'note:delete',
    name: 'commands.deleteCurrentNote',
    hotkey: 'Mod+Backspace',
    scope: ['notelist', 'editor'],
    execute: () => {
      const { activeNote } = useNoteStore.getState();
      if (activeNote) {
        useAppStore.getState().requestDeleteNote(activeNote.path);
      }
    },
  });

  commandRegistry.register({
    id: 'view:toggle-sidebar',
    name: 'commands.toggleSidebar',
    hotkey: 'Mod+1',
    execute: () => useAppStore.getState().toggleSidebar(),
  });

  commandRegistry.register({
    id: 'view:toggle-note-list',
    name: 'commands.toggleNoteList',
    hotkey: 'Mod+2',
    execute: () => useAppStore.getState().toggleNoteList(),
  });

  commandRegistry.register({
    id: 'view:toggle-note-info',
    name: 'commands.toggleNoteInfo',
    hotkey: 'Mod+3',
    execute: () => useAppStore.getState().toggleNoteInfo(),
  });

  commandRegistry.register({
    id: 'app:open-settings',
    name: 'commands.openSettings',
    hotkey: 'Mod+,',
    execute: () => {
      const { viewMode, enterSettings, exitSettings } = useAppStore.getState();
      if (viewMode === 'settings') {
        exitSettings();
      } else {
        enterSettings();
      }
    },
  });

  commandRegistry.register({
    id: 'app:open-search',
    name: 'commands.searchNotes',
    hotkey: 'Mod+Shift+F',
    execute: () => useAppStore.getState().toggleSearch(),
  });

  commandRegistry.register({
    id: 'app:command-palette',
    name: 'commands.openCommandPalette',
    hotkey: 'Mod+P',
    execute: () => useAppStore.getState().toggleCommandPalette(),
  });

  commandRegistry.register({
    id: 'note:rename',
    name: 'commands.renameNote',
    hotkey: 'Enter',
    scope: ['notelist'],
    execute: () => {
      const { activeNote } = useNoteStore.getState();
      if (activeNote) {
        document.dispatchEvent(new CustomEvent('graphite:focus-title'));
      }
    },
  });

  commandRegistry.register({
    id: 'note:toggle-pin',
    name: 'commands.togglePin',
    hotkey: 'Mod+Shift+P',
    scope: ['sidebar', 'notelist'],
    execute: () => {
      const { activeNote, pinNote } = useNoteStore.getState();
      if (activeNote) {
        pinNote(activeNote.path, !activeNote.pinned);
      }
    },
  });

  commandRegistry.register({
    id: 'app:open-trash',
    name: 'commands.openTrash',
    hotkey: '',
    execute: () => useAppStore.getState().toggleTrash(),
  });

  commandRegistry.register({
    id: 'folder:rename',
    name: 'commands.renameFolder',
    hotkey: 'Enter',
    scope: ['sidebar'],
    execute: () => {
      const { section } = useSidebarStore.getState();
      if (section === 'trash') {
        document.dispatchEvent(new CustomEvent('graphite:restore-trash'));
        return;
      }
      const { activeFolder } = useNoteStore.getState();
      if (activeFolder) {
        document.dispatchEvent(new CustomEvent('graphite:rename-folder'));
      }
    },
  });

  commandRegistry.register({
    id: 'app:cheat-sheet',
    name: 'commands.keyboardShortcuts',
    hotkey: 'Mod+/',
    execute: () => useAppStore.getState().toggleCheatSheet(),
  });

  commandRegistry.register({
    id: 'app:reload',
    name: 'commands.reloadApp',
    hotkey: 'Mod+R',
    execute: () => window.location.reload(),
  });

  commandRegistry.register({
    id: 'folder:delete',
    name: 'commands.deleteFolder',
    hotkey: 'Mod+Backspace',
    scope: ['sidebar'],
    execute: () => {
      const { section } = useSidebarStore.getState();
      if (section === 'trash') {
        document.dispatchEvent(
          new CustomEvent('graphite:delete-trash-permanently')
        );
        return;
      }
      const { activeFolder } = useNoteStore.getState();
      if (activeFolder) {
        document.dispatchEvent(new CustomEvent('graphite:delete-folder'));
      }
    },
  });

  commandRegistry.register({
    id: 'trash:restore',
    name: 'commands.restoreFromTrash',
    hotkey: '',
    scope: ['sidebar'],
    execute: () => {
      document.dispatchEvent(new CustomEvent('graphite:restore-trash'));
    },
  });

  commandRegistry.register({
    id: 'trash:delete',
    name: 'commands.deletePermanently',
    hotkey: '',
    scope: ['sidebar'],
    execute: () => {
      document.dispatchEvent(
        new CustomEvent('graphite:delete-trash-permanently')
      );
    },
  });

  commandRegistry.register({
    id: 'view:zoom-in',
    name: 'commands.zoomIn',
    hotkey: 'Mod+=',
    execute: () => {
      const current = useSettingsStore.getState().settings.zoomLevel;
      const idx = ZOOM_LEVELS.findIndex((l) => l > current);
      const next =
        idx === -1 ? ZOOM_LEVELS[ZOOM_LEVELS.length - 1] : ZOOM_LEVELS[idx];
      if (next !== current) {
        zoomApi.setZoom(next);
        useSettingsStore.getState().updateSetting('zoomLevel', next);
      }
    },
  });

  commandRegistry.register({
    id: 'view:zoom-out',
    name: 'commands.zoomOut',
    hotkey: 'Mod+-',
    execute: () => {
      const current = useSettingsStore.getState().settings.zoomLevel;
      const idx = [...ZOOM_LEVELS].reverse().findIndex((l) => l < current);
      const next =
        idx === -1 ? ZOOM_LEVELS[0] : ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx];
      if (next !== current) {
        zoomApi.setZoom(next);
        useSettingsStore.getState().updateSetting('zoomLevel', next);
      }
    },
  });

  commandRegistry.register({
    id: 'view:zoom-reset',
    name: 'commands.zoomReset',
    hotkey: 'Mod+0',
    execute: () => {
      zoomApi.setZoom(1.0);
      useSettingsStore.getState().updateSetting('zoomLevel', 1.0);
    },
  });

  commandRegistry.register({
    id: 'history:back',
    name: 'commands.historyBack',
    hotkey: 'Mod+[',
    execute: () => {
      const path = useHistoryStore.getState().goBack();
      if (path) useNoteStore.getState().navigateToHistory(path);
    },
  });

  commandRegistry.register({
    id: 'history:forward',
    name: 'commands.historyForward',
    hotkey: 'Mod+]',
    execute: () => {
      const path = useHistoryStore.getState().goForward();
      if (path) useNoteStore.getState().navigateToHistory(path);
    },
  });

  commandRegistry.register({
    id: 'history:show',
    name: 'commands.showHistory',
    hotkey: 'Mod+Y',
    execute: () => useAppStore.getState().toggleHistory(),
  });
}
