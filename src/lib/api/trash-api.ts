import { invoke } from '@tauri-apps/api/core';
import type { TrashItem } from '@/types/note';

export const trashApi = {
  listTrash: () => invoke<TrashItem[]>('list_trash'),

  restoreNote: (id: string) => invoke<void>('restore_note', { id }),

  permanentlyDelete: (id: string) =>
    invoke<void>('permanently_delete_trash', { id }),

  emptyTrash: () => invoke<void>('empty_trash'),

  purgeExpiredTrash: (retentionDays: number) =>
    invoke<void>('purge_expired_trash', { retentionDays }),
};
