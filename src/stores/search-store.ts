import { create } from 'zustand';
import { searchApi } from '@/lib/api/search-api';
import type { SearchResult } from '../types/note';

interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;

  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  loading: false,

  setQuery: (query) => set({ query }),

  search: async (query) => {
    if (!query.trim()) {
      set({ results: [], loading: false });
      return;
    }
    set({ loading: true });
    try {
      const results = await searchApi.searchNotes(query);
      set({ results, loading: false });
    } catch (e) {
      console.error('Search error:', e);
      set({ results: [], loading: false });
    }
  },

  clear: () => set({ query: '', results: [], loading: false }),
}));
