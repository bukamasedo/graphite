import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteListItem } from '@/types/note';

export const noteApi = {
  listNotes: (folder: string | null, tag: string | null) =>
    invoke<NoteListItem[]>('list_notes', { folder, tag }),

  readNote: (path: string) => invoke<Note>('read_note', { path }),

  createNote: (folder: string | null, title: string | null) =>
    invoke<Note>('create_note', { folder, title }),

  writeNote: (
    path: string,
    content: string,
    title: string | null,
    tags: string[] | null,
    pinned: boolean | null
  ) => invoke<void>('write_note', { path, content, title, tags, pinned }),

  deleteNote: (path: string) => invoke<void>('delete_note', { path }),

  renameNote: (path: string, newTitle: string) =>
    invoke<string>('rename_note', { path, newTitle }),

  readTrashNote: (id: string) => invoke<Note>('read_trash_note', { id }),
};
