import { useEffect } from 'react';
import { getNavDirection, isEditableTarget } from '@/lib/platform';
import { type SettingsSection, useAppStore } from '@/stores/app-store';
import { useEditorStore } from '@/stores/editor-store';
import { useNoteStore } from '@/stores/note-store';
import {
  computeTrashGroups,
  type SidebarSection,
  useSidebarStore,
} from '@/stores/sidebar-store';

const settingsSections: SettingsSection[] = [
  'general',
  'editor',
  'appearance',
  'hotkeys',
  'about',
];

/**
 * Keyboard navigation across panels and within lists.
 *
 * Supports three paradigms (see keybinding-conventions.md):
 * - Vi:    h/j/k/l
 * - Emacs: Ctrl+b/n/p/f
 * - Arrow: ←/↓/↑/→
 *
 * Behavior:
 * - up/down: navigate items within the focused panel
 *   - sidebar: folders → trash → tags (continuous list)
 * - left/right: move focus to prev/next panel (sidebar ↔ notelist ↔ editor)
 * - Editor panel: all keys passed through to Tiptap (no interception)
 */
export function usePanelNavigation() {
  // Read focusedPanel reactively for editor DOM focus sync
  const focusedPanel = useAppStore((s) => s.focusedPanel);

  // Single stable handler — reads all state from .getState() to avoid stale closures
  useEffect(() => {
    const autoSelectFirstNote = () => {
      const ns = useNoteStore.getState();
      if (ns.notes.length === 0) return;
      const isTrash = ns.activeTrashGroup !== null;
      const hasActive =
        ns.activeNote &&
        ns.notes.some((n) =>
          isTrash ? n.id === ns.activeNote?.id : n.path === ns.activeNote?.path
        );
      if (!hasActive) {
        if (isTrash) {
          ns.selectTrashNote(ns.notes[0].id);
        } else {
          ns.selectNote(ns.notes[0].path);
        }
      }
    };

    const handleNavigation = (e: KeyboardEvent) => {
      if (isEditableTarget(e)) return;

      // Don't intercept when history popover is open
      if (useAppStore.getState().historyOpen) return;

      const { focusedPanel: panel, viewMode } = useAppStore.getState();

      // Don't intercept in editor panel — let Tiptap handle everything (notes mode only)
      if (panel === 'editor' && viewMode !== 'settings') return;

      // Don't intercept Mod+key combos (handled by useCommandHotkeys)
      if (e.metaKey || e.altKey) return;
      // Allow Ctrl only for Emacs bindings (Ctrl+n/p/f/b)
      if (e.ctrlKey && !['n', 'p', 'f', 'b'].includes(e.key)) return;

      const dir = getNavDirection(e);
      if (!dir) return;

      // Settings mode navigation
      if (viewMode === 'settings') {
        if (panel === 'sidebar' && (dir === 'up' || dir === 'down')) {
          e.preventDefault();
          const { settingsSection, setSettingsSection } =
            useAppStore.getState();
          const idx = settingsSections.indexOf(settingsSection);
          const next =
            dir === 'down'
              ? (idx + 1) % settingsSections.length
              : (idx - 1 + settingsSections.length) % settingsSections.length;
          setSettingsSection(settingsSections[next]);
          return;
        }
        if (dir === 'left' || dir === 'right') {
          e.preventDefault();
          // sidebar ↔ editor (no notelist in settings mode)
          if (dir === 'right' && panel === 'sidebar') {
            useAppStore.getState().setFocusedPanel('editor');
          } else if (dir === 'left' && panel === 'editor') {
            useAppStore.getState().setFocusedPanel('sidebar');
          }
          return;
        }
        return;
      }

      e.preventDefault();

      // left/right: switch panels (don't move to notelist if empty)
      if (dir === 'left') {
        const prevPanel = useAppStore.getState().focusedPanel;
        useAppStore.getState().focusPrevPanel();
        if (useAppStore.getState().focusedPanel === 'notelist') {
          if (useNoteStore.getState().notes.length === 0) {
            useAppStore.getState().setFocusedPanel(prevPanel);
          } else {
            autoSelectFirstNote();
          }
        }
        return;
      }
      if (dir === 'right') {
        const prevPanel = useAppStore.getState().focusedPanel;
        useAppStore.getState().focusNextPanel();
        if (useAppStore.getState().focusedPanel === 'notelist') {
          if (useNoteStore.getState().notes.length === 0) {
            useAppStore.getState().setFocusedPanel(prevPanel);
          } else {
            autoSelectFirstNote();
          }
        }
        return;
      }

      // up/down: navigate within panel
      if (panel === 'sidebar') {
        const sb = useSidebarStore.getState();
        const ns = useNoteStore.getState();
        const allPaths = ['', ...ns.flatFolderPaths];
        const vaultPath = useAppStore.getState().vaultPath;
        navigateSidebar(
          dir,
          sb,
          allPaths,
          ns.activeFolder,
          ns.selectFolder,
          ns.selectTag,
          vaultPath
        );
      }

      if (panel === 'notelist') {
        const ns = useNoteStore.getState();
        if (ns.notes.length === 0) return;
        const isTrash = ns.activeTrashGroup !== null;
        const currentIdx = ns.activeNote
          ? ns.notes.findIndex((n) =>
              isTrash
                ? n.id === ns.activeNote?.id
                : n.path === ns.activeNote?.path
            )
          : -1;
        let nextIdx: number;
        if (dir === 'down') {
          nextIdx = currentIdx < ns.notes.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : ns.notes.length - 1;
        }
        if (isTrash) {
          ns.selectTrashNote(ns.notes[nextIdx].id);
        } else {
          ns.selectNote(ns.notes[nextIdx].path);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, []);

  // Sync DOM focus with logical focusedPanel state
  const editor = useEditorStore((s) => s.editor);
  useEffect(() => {
    if (!editor) return;
    if (focusedPanel === 'editor') {
      // Don't steal focus from input/textarea elements (e.g. InlineTitle)
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return;
      }
      editor.commands.focus();
    } else {
      editor.view.dom.blur();
    }
  }, [focusedPanel, editor]);
}

/**
 * Navigate the sidebar as a continuous list: folders → trash → tags.
 * Wraps around at boundaries.
 */
function navigateSidebar(
  dir: 'up' | 'down',
  sb: ReturnType<typeof useSidebarStore.getState>,
  allFolderPaths: string[],
  activeFolder: string,
  selectFolder: (path: string) => void,
  selectTag: (tag: string) => void,
  vaultPath: string
) {
  const { section, trashItems, tags, activeTrashIndex, activeTagIndex } = sb;

  const trashGroups = computeTrashGroups(trashItems, vaultPath);

  // Build ordered list of non-empty sections
  const allSections: { id: SidebarSection; count: number }[] = [
    { id: 'folders', count: allFolderPaths.length },
    { id: 'trash', count: trashGroups.length },
    { id: 'tags', count: tags.length },
  ];
  const sections = allSections.filter((s) => s.count > 0);

  if (sections.length === 0) return;

  // Find current section (default to first if current section became empty)
  let sIdx = sections.findIndex((s) => s.id === section);
  if (sIdx === -1) sIdx = 0;

  // Get current item index within section
  const getItemIdx = (sec: SidebarSection): number => {
    switch (sec) {
      case 'folders':
        return Math.max(0, allFolderPaths.indexOf(activeFolder));
      case 'trash':
        return Math.max(0, Math.min(activeTrashIndex, trashGroups.length - 1));
      case 'tags':
        return Math.max(0, Math.min(activeTagIndex, tags.length - 1));
    }
  };

  const activate = (sec: SidebarSection, idx: number) => {
    sb.setSection(sec);
    switch (sec) {
      case 'folders':
        selectFolder(allFolderPaths[idx]);
        break;
      case 'trash':
        sb.setActiveTrashIndex(idx);
        if (trashGroups[idx]) {
          useNoteStore.getState().selectTrashGroup(trashGroups[idx].folder);
        }
        break;
      case 'tags':
        sb.setActiveTagIndex(idx);
        selectTag(sb.tags[idx].name);
        break;
    }
  };

  const itemIdx = getItemIdx(sections[sIdx].id);

  if (dir === 'down') {
    if (itemIdx < sections[sIdx].count - 1) {
      activate(sections[sIdx].id, itemIdx + 1);
    } else {
      const nextSIdx = (sIdx + 1) % sections.length;
      activate(sections[nextSIdx].id, 0);
    }
  } else {
    if (itemIdx > 0) {
      activate(sections[sIdx].id, itemIdx - 1);
    } else {
      const prevSIdx = (sIdx - 1 + sections.length) % sections.length;
      activate(sections[prevSIdx].id, sections[prevSIdx].count - 1);
    }
  }
}
