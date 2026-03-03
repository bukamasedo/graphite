import { invoke } from '@tauri-apps/api/core';
import type { Folder } from '@/types/note';

export const folderApi = {
  listFolders: () => invoke<Folder[]>('list_folders'),

  createFolder: (name: string, parent: string | null) =>
    invoke<void>('create_folder', { name, parent }),

  deleteFolder: (path: string) => invoke<void>('delete_folder', { path }),

  renameFolder: (path: string, newName: string) =>
    invoke<void>('rename_folder', { path, newName }),

  moveNote: (notePath: string, targetFolder: string) =>
    invoke<void>('move_note', { notePath, targetFolder }),
};
