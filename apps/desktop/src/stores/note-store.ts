import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import i18n from '@/i18n';
import type { Note, NoteListItem, Folder } from '@graphite/shared';
import { useSidebarStore, computeTrashGroups } from '@/stores/sidebar-store';
import { useAppStore } from '@/stores/app-store';
import { useHistoryStore } from '@/stores/history-store';

interface NoteState {
  notes: NoteListItem[];
  activeNote: Note | null;
  activeFolder: string;
  activeTag: string | null;
  activeTrashGroup: string | null;
  folders: Folder[];
  flatFolderPaths: string[];
  loading: boolean;
  error: string | null;

  loadNotes: (folder?: string, tag?: string) => Promise<void>;
  loadFolders: () => Promise<void>;
  selectNote: (path: string) => Promise<void>;
  createNote: (folder?: string, title?: string) => Promise<Note>;
  saveNote: (path: string, content: string) => Promise<void>;
  deleteNote: (path: string) => Promise<void>;
  renameNote: (path: string, newTitle: string) => Promise<void>;
  pinNote: (path: string, pinned: boolean) => Promise<void>;
  updateTags: (path: string, tags: string[]) => Promise<void>;
  updateActiveContent: (content: string) => void;
  setActiveNoteTitle: (title: string) => void;
  setActiveNotePreview: (preview: string) => void;
  setActiveFolder: (folder: string) => void;
  selectFolder: (folder: string) => void;
  selectTag: (tag: string) => void;
  selectTrashGroup: (folder: string) => void;
  selectTrashNote: (id: string) => Promise<void>;
  navigateToHistory: (path: string) => Promise<void>;
}

function flattenFolders(folders: Folder[]): string[] {
  const result: string[] = [];
  for (const f of folders) {
    result.push(f.path);
    result.push(...flattenFolders(f.children));
  }
  return result;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  activeFolder: '',
  activeTag: null,
  activeTrashGroup: null,
  folders: [],
  flatFolderPaths: [],
  loading: false,
  error: null,

  loadNotes: async (folder?: string, tag?: string) => {
    set({ loading: true, error: null });
    try {
      const currentTag = tag ?? get().activeTag;
      const notes = await invoke<NoteListItem[]>('list_notes', {
        folder: currentTag ? null : (folder ?? (get().activeFolder || null)),
        tag: currentTag ?? null,
      });
      set({ notes, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      toast.error(i18n.t('toast.loadFailed'));
    }
  },

  loadFolders: async () => {
    try {
      const folders = await invoke<Folder[]>('list_folders');
      set({ folders, flatFolderPaths: flattenFolders(folders) });
    } catch (e) {
      console.error('Failed to load folders:', e);
    }
  },

  selectNote: async (path: string) => {
    // In trash mode, use selectTrashNote instead
    if (get().activeTrashGroup !== null) return;
    try {
      const note = await invoke<Note>('read_note', { path });
      set({ activeNote: note });
      useHistoryStore.getState().push(path);
      // Sync folder only when the note isn't visible in the current list
      const inCurrentList = get().notes.some((n) => n.path === path);
      if (!inCurrentList) {
        set({ activeFolder: note.folder });
        await get().loadNotes(note.folder);
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createNote: async (folder?: string, title?: string) => {
    const note = await invoke<Note>('create_note', {
      folder: folder || get().activeFolder || null,
      title: title || null,
    });
    set({ activeNote: note });
    await get().loadNotes();
    toast.success(i18n.t('toast.noteCreated'));
    return note;
  },

  saveNote: async (path: string, content: string) => {
    try {
      await invoke('write_note', {
        path,
        content,
        title: null as string | null,
        tags: null as string[] | null,
        pinned: null as boolean | null,
      });
    } catch {
      toast.error(i18n.t('toast.saveFailed'));
    }
  },

  deleteNote: async (path: string) => {
    await invoke('delete_note', { path });
    const { activeNote } = get();
    if (activeNote?.path === path) {
      set({ activeNote: null });
    }
    await get().loadNotes();
    toast.success(i18n.t('toast.noteMovedToTrash'));
  },

  renameNote: async (path: string, newTitle: string) => {
    const newPath = await invoke<string>('rename_note', { path, newTitle });
    const { activeNote } = get();
    if (activeNote?.path === path) {
      set({
        activeNote: { ...activeNote, path: newPath, title: newTitle },
      });
    }
    await get().loadNotes();
    toast.success(i18n.t('toast.noteRenamed'));
  },

  pinNote: async (path: string, pinned: boolean) => {
    const note = await invoke<Note>('read_note', { path });
    await invoke('write_note', {
      path,
      content: note.content,
      title: null as string | null,
      tags: null as string[] | null,
      pinned,
    });
    const { activeNote } = get();
    if (activeNote?.path === path) {
      set({ activeNote: { ...activeNote, pinned } });
    }
    await get().loadNotes();
  },

  updateTags: async (path: string, tags: string[]) => {
    const { activeNote } = get();
    if (!activeNote) return;
    await invoke('write_note', {
      path,
      content: activeNote.content,
      title: null as string | null,
      tags,
      pinned: null as boolean | null,
    });
    set({
      activeNote: { ...activeNote, tags },
      notes: get().notes.map((n) =>
        n.path === path ? { ...n, tags } : n,
      ),
    });
  },

  updateActiveContent: (content: string) => {
    const { activeNote } = get();
    if (!activeNote) return;
    set({ activeNote: { ...activeNote, content } });
  },

  setActiveNoteTitle: (title: string) => {
    const { activeNote, notes } = get();
    if (!activeNote) return;
    set({
      activeNote: { ...activeNote, title },
      notes: notes.map((n) =>
        n.path === activeNote.path ? { ...n, title } : n,
      ),
    });
  },

  setActiveNotePreview: (preview: string) => {
    const { activeNote, notes } = get();
    if (!activeNote) return;
    const current = notes.find((n) => n.path === activeNote.path);
    if (current?.preview === preview) return;
    set({
      notes: notes.map((n) =>
        n.path === activeNote.path ? { ...n, preview } : n,
      ),
    });
  },

  setActiveFolder: (folder: string) => {
    set({ activeFolder: folder });
  },

  selectFolder: (folder: string) => {
    set({ activeFolder: folder, activeTag: null, activeTrashGroup: null, activeNote: null });
    get().loadNotes(folder);
  },

  selectTag: (tag: string) => {
    set({ activeTag: tag, activeFolder: '', activeTrashGroup: null, activeNote: null });
    get().loadNotes(undefined, tag);
  },

  selectTrashGroup: (folder: string) => {
    const { trashItems } = useSidebarStore.getState();
    const { vaultPath } = useAppStore.getState();
    const groups = computeTrashGroups(trashItems, vaultPath);
    const group = groups.find((g) => g.folder === folder);
    if (!group) return;

    // Convert trash items to NoteListItem format for the note list
    const notes: NoteListItem[] = group.items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.trash_path,
      folder: '',
      tags: [],
      created: '',
      modified: item.deleted_at,
      pinned: false,
      preview: item.preview,
    }));

    set({ activeTrashGroup: folder, activeTag: null, activeFolder: '', activeNote: null, notes });
  },

  selectTrashNote: async (id: string) => {
    try {
      const note = await invoke<Note>('read_trash_note', { id });
      set({ activeNote: note });
    } catch (e) {
      console.error('Failed to read trash note:', e);
    }
  },

  navigateToHistory: async (path: string) => {
    try {
      const note = await invoke<Note>('read_note', { path });
      set({ activeNote: note, activeTrashGroup: null });
      const inCurrentList = get().notes.some((n) => n.path === path);
      if (!inCurrentList) {
        set({ activeFolder: note.folder, activeTag: null });
        await get().loadNotes(note.folder);
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));

export function extractPreview(content: string, maxLen = 120): string {
  const lines: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) continue;
    lines.push(trimmed);
    if (lines.length >= 3) break;
  }
  const preview = lines.join(' ');
  return preview.length > maxLen ? preview.slice(0, maxLen) + '...' : preview;
}
