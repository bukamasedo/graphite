import { invoke } from '@tauri-apps/api/core';
import type { SearchResult } from '@/types/note';

export const searchApi = {
  searchNotes: (query: string) =>
    invoke<SearchResult[]>('search_notes', { query }),
};
