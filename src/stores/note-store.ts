import { toast } from 'sonner';
import { create } from 'zustand';
import i18n from '@/i18n';
import { folderApi } from '@/lib/api/folder-api';
import { noteApi } from '@/lib/api/note-api';
import { computeTrashGroups } from '@/lib/trash-groups';
import { useAppStore } from '@/stores/app-store';
import { useHistoryStore } from '@/stores/history-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import type { Folder, Note, NoteListItem } from '../types/note';

export type SortKey = 'modified' | 'created' | 'title';

interface NoteState {
  notes: NoteListItem[];
  activeNote: Note | null;
  activeFolder: string;
  activeTag: string | null;
  activeTrashGroup: string | null;
  folders: Folder[];
  flatFolderPaths: string[];
  totalNoteCount: number;
  loading: boolean;
  error: string | null;
  sortKey: SortKey;

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
  createFolder: (name: string, parent: string | null) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  renameFolder: (path: string, newName: string) => Promise<void>;
  moveNote: (notePath: string, targetFolder: string) => Promise<void>;
  setSortKey: (key: SortKey) => void;
}

function flattenFolders(folders: Folder[]): string[] {
  const result: string[] = [];
  for (const f of folders) {
    result.push(f.path);
    result.push(...flattenFolders(f.children));
  }
  return result;
}

function sortNotes(notes: NoteListItem[], key: SortKey): NoteListItem[] {
  return [...notes].sort((a, b) => {
    // Pinned notes always first
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'created':
        return b.created.localeCompare(a.created);
      default:
        return b.modified.localeCompare(a.modified);
    }
  });
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  activeFolder: '',
  activeTag: null,
  activeTrashGroup: null,
  folders: [],
  flatFolderPaths: [],
  totalNoteCount: 0,
  loading: false,
  error: null,
  sortKey: 'modified',

  loadNotes: async (folder?: string, tag?: string) => {
    set({ loading: true, error: null });
    try {
      const currentTag = tag ?? get().activeTag;
      const raw = await noteApi.listNotes(
        currentTag ? null : (folder ?? (get().activeFolder || null)),
        currentTag ?? null
      );
      set({ notes: sortNotes(raw, get().sortKey), loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      toast.error(i18n.t('toast.loadFailed'));
    }
  },

  loadFolders: async () => {
    try {
      const [folders, totalNoteCount] = await Promise.all([
        folderApi.listFolders(),
        folderApi.countAllNotes(),
      ]);
      set({
        folders,
        flatFolderPaths: flattenFolders(folders),
        totalNoteCount,
      });
    } catch (e) {
      console.error('Failed to load folders:', e);
    }
  },

  selectNote: async (path: string) => {
    // In trash mode, use selectTrashNote instead
    if (get().activeTrashGroup !== null) return;
    try {
      const note = await noteApi.readNote(path);
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
    const note = await noteApi.createNote(
      folder || get().activeFolder || null,
      title || null
    );
    set({ activeNote: note });
    await get().loadNotes();
    await get().loadFolders();
    toast.success(i18n.t('toast.noteCreated'));
    return note;
  },

  saveNote: async (path: string, content: string) => {
    try {
      await noteApi.writeNote(
        path,
        content,
        null as string | null,
        null as string[] | null,
        null as boolean | null
      );
    } catch {
      toast.error(i18n.t('toast.saveFailed'));
    }
  },

  deleteNote: async (path: string) => {
    await noteApi.deleteNote(path);
    const { activeNote } = get();
    if (activeNote?.path === path) {
      set({ activeNote: null });
    }
    await get().loadNotes();
    await get().loadFolders();
    const sidebar = useSidebarStore.getState();
    sidebar.loadTrash();
    sidebar.loadTags();
    toast.success(i18n.t('toast.noteMovedToTrash'));
  },

  renameNote: async (path: string, newTitle: string) => {
    const newPath = await noteApi.renameNote(path, newTitle);
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
    const note = await noteApi.readNote(path);
    await noteApi.writeNote(
      path,
      note.content,
      null as string | null,
      null as string[] | null,
      pinned
    );
    const { activeNote } = get();
    if (activeNote?.path === path) {
      set({ activeNote: { ...activeNote, pinned } });
    }
    await get().loadNotes();
  },

  updateTags: async (path: string, tags: string[]) => {
    const { activeNote } = get();
    if (!activeNote) return;
    await noteApi.writeNote(
      path,
      activeNote.content,
      null as string | null,
      tags,
      null as boolean | null
    );
    set({
      activeNote: { ...activeNote, tags },
      notes: get().notes.map((n) => (n.path === path ? { ...n, tags } : n)),
    });
    useSidebarStore.getState().loadTags();
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
        n.path === activeNote.path ? { ...n, title } : n
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
        n.path === activeNote.path ? { ...n, preview } : n
      ),
    });
  },

  setActiveFolder: (folder: string) => {
    set({ activeFolder: folder });
  },

  selectFolder: (folder: string) => {
    set({
      activeFolder: folder,
      activeTag: null,
      activeTrashGroup: null,
      activeNote: null,
    });
    get().loadNotes(folder);
  },

  selectTag: (tag: string) => {
    set({
      activeTag: tag,
      activeFolder: '',
      activeTrashGroup: null,
      activeNote: null,
    });
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

    set({
      activeTrashGroup: folder,
      activeTag: null,
      activeFolder: '',
      activeNote: null,
      notes,
    });
  },

  selectTrashNote: async (id: string) => {
    try {
      const note = await noteApi.readTrashNote(id);
      set({ activeNote: note });
    } catch (e) {
      console.error('Failed to read trash note:', e);
    }
  },

  navigateToHistory: async (path: string) => {
    try {
      const note = await noteApi.readNote(path);
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

  createFolder: async (name: string, parent: string | null) => {
    await folderApi.createFolder(name, parent);
    await get().loadFolders();
    toast.success(i18n.t('toast.folderCreated'));
  },

  deleteFolder: async (path: string) => {
    await folderApi.deleteFolder(path);
    await get().loadFolders();
    useSidebarStore.getState().loadTrash();
    toast.success(i18n.t('toast.folderDeleted'));
  },

  renameFolder: async (path: string, newName: string) => {
    await folderApi.renameFolder(path, newName);
    await get().loadFolders();
    toast.success(i18n.t('toast.folderRenamed'));
  },

  moveNote: async (notePath: string, targetFolder: string) => {
    await folderApi.moveNote(notePath, targetFolder);
    await get().loadFolders();
    await get().loadNotes();
    toast.success(i18n.t('toast.noteMoved'));
  },

  setSortKey: (key: SortKey) => {
    set({ sortKey: key, notes: sortNotes(get().notes, key) });
  },
}));

export function extractPreview(content: string, maxLen = 120): string {
  const lines: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```'))
      continue;
    lines.push(trimmed);
    if (lines.length >= 3) break;
  }
  const preview = lines.join(' ');
  return preview.length > maxLen ? `${preview.slice(0, maxLen)}...` : preview;
}
