import { useEffect } from 'react';
import {
  Group,
  Panel,
  type PanelSize,
  Separator,
  usePanelRef,
} from 'react-resizable-panels';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { CommandPalette } from '../commandpalette/command-palette';
import { EditorArea } from '../editor/editor-area';
import { NoteInfoPanel } from '../editor/note-info-panel';
import { NoteList } from '../notelist/note-list';
import { SearchModal } from '../search/search-modal';
import { Sidebar } from '../sidebar/sidebar';
import { TitleBar } from './title-bar';

export function AppLayout() {
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const noteListVisible = useAppStore((s) => s.noteListVisible);
  const noteInfoVisible = useAppStore((s) => s.noteInfoVisible);
  const viewMode = useAppStore((s) => s.viewMode);
  const focusedPanel = useAppStore((s) => s.focusedPanel);
  const setFocusedPanel = useAppStore((s) => s.setFocusedPanel);
  const activeNote = useNoteStore((s) => s.activeNote);

  const sidebarRef = usePanelRef();
  const noteListRef = usePanelRef();
  const noteInfoRef = usePanelRef();

  useEffect(() => {
    const panel = sidebarRef.current;
    if (!panel) return;
    if (sidebarVisible) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [sidebarVisible]);

  useEffect(() => {
    const panel = noteListRef.current;
    if (!panel) return;
    if (noteListVisible) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [noteListVisible]);

  useEffect(() => {
    const panel = noteInfoRef.current;
    if (!panel) return;
    if (noteInfoVisible && activeNote) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [noteInfoVisible, activeNote]);

  // Esc key exits settings mode (unless a dialog is open or hotkey recording is active)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const { viewMode, commandPaletteOpen, searchOpen, cheatSheetOpen } =
        useAppStore.getState();
      if (viewMode !== 'settings') return;
      if (commandPaletteOpen || searchOpen || cheatSheetOpen) return;
      // HotkeysSection calls stopPropagation during recording, so this won't fire
      e.preventDefault();
      useAppStore.getState().exitSettings();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSidebarResize = (size: PanelSize) => {
    const collapsed = size.asPercentage < 1;
    if (collapsed && sidebarVisible) {
      useAppStore.getState().toggleSidebar();
    } else if (!collapsed && !sidebarVisible) {
      useAppStore.getState().toggleSidebar();
    }
  };

  const handleNoteListResize = (size: PanelSize) => {
    const collapsed = size.asPercentage < 1;
    if (collapsed && noteListVisible) {
      useAppStore.getState().toggleNoteList();
    } else if (!collapsed && !noteListVisible) {
      useAppStore.getState().toggleNoteList();
    }
  };

  const handleNoteInfoResize = (size: PanelSize) => {
    const collapsed = size.asPercentage < 1;
    if (collapsed && noteInfoVisible) {
      useAppStore.getState().toggleNoteInfo();
    } else if (!collapsed && !noteInfoVisible) {
      useAppStore.getState().toggleNoteInfo();
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <TitleBar />
      <Group
        orientation="horizontal"
        id="graphite-panels"
        className="flex-1 overflow-hidden"
      >
        <Panel
          panelRef={sidebarRef}
          id="sidebar"
          defaultSize="18%"
          minSize="12%"
          maxSize="30%"
          collapsible
          collapsedSize="0%"
          onResize={handleSidebarResize}
        >
          <div
            onClick={() => setFocusedPanel('sidebar')}
            className="h-full overflow-hidden"
          >
            <Sidebar />
          </div>
        </Panel>
        <Separator className="w-px bg-transparent hover:bg-transparent active:bg-transparent transition-colors duration-150" />
        <Panel id="main-content" defaultSize="82%" minSize="60%">
          <div
            className={`h-full pb-1.5 pr-1.5 ${!sidebarVisible ? 'pl-1.5' : ''}`}
            style={{ paddingTop: 'var(--titlebar-height)' }}
          >
            <div
              className="h-full rounded-2xl border border-white/[0.07] overflow-hidden"
              style={{ background: 'var(--editor-bg)' }}
            >
              <Group orientation="horizontal" id="main-panels">
                <Panel
                  panelRef={noteListRef}
                  id="notelist"
                  defaultSize="27%"
                  minSize="18%"
                  maxSize="50%"
                  collapsible
                  collapsedSize="0%"
                  onResize={handleNoteListResize}
                >
                  <div
                    onClick={() => setFocusedPanel('notelist')}
                    className="h-full overflow-hidden"
                  >
                    <NoteList />
                  </div>
                </Panel>
                <Separator className="w-px bg-white/[0.06] hover:bg-white/[0.12] active:bg-accent/30 transition-colors duration-150" />
                <Panel id="editor" defaultSize="73%" minSize="37%">
                  <div
                    onClick={() => setFocusedPanel('editor')}
                    className="h-full overflow-hidden"
                  >
                    <EditorArea />
                  </div>
                </Panel>
                <Separator className="w-px bg-white/[0.06] hover:bg-white/[0.12] active:bg-accent/30 transition-colors duration-150" />
                <Panel
                  panelRef={noteInfoRef}
                  id="noteinfo"
                  defaultSize="22%"
                  minSize="15%"
                  maxSize="35%"
                  collapsible
                  collapsedSize="0%"
                  onResize={handleNoteInfoResize}
                >
                  <div
                    onClick={() => setFocusedPanel('noteinfo')}
                    className="h-full overflow-hidden"
                  >
                    <NoteInfoPanel />
                  </div>
                </Panel>
              </Group>
            </div>
          </div>
        </Panel>
      </Group>
      <SearchModal />
      <CommandPalette />
    </div>
  );
}
