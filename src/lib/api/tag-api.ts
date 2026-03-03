import { invoke } from '@tauri-apps/api/core';
import type { Tag } from '@/types/note';

export const tagApi = {
  listTags: () => invoke<Tag[]>('list_tags'),
};
