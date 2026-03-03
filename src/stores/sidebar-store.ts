import { toast } from 'sonner';
import { create } from 'zustand';
import i18n from '@/i18n';
import { tagApi } from '@/lib/api/tag-api';
import { trashApi } from '@/lib/api/trash-api';
import type { Tag, TrashItem } from '../types/note';

export type SidebarSection = 'folders' | 'trash' | 'tags';

export { computeTrashGroups, type TrashGroup } from '@/lib/trash-groups';

interface SidebarState {
  section: SidebarSection;
  trashItems: TrashItem[];
  tags: Tag[];
  activeTrashIndex: number;
  activeTagIndex: number;

  setSection: (section: SidebarSection) => void;
  setActiveTrashIndex: (index: number) => void;
  setActiveTagIndex: (index: number) => void;
  loadTrash: () => Promise<void>;
  loadTags: () => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteTrash: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  section: 'folders',
  trashItems: [],
  tags: [],
  activeTrashIndex: -1,
  activeTagIndex: -1,

  setSection: (section) => set({ section }),
  setActiveTrashIndex: (index) => set({ activeTrashIndex: index }),
  setActiveTagIndex: (index) => set({ activeTagIndex: index }),

  loadTrash: async () => {
    try {
      const trashItems = await trashApi.listTrash();
      set((s) => ({
        trashItems,
        activeTrashIndex:
          s.activeTrashIndex >= trashItems.length
            ? trashItems.length - 1
            : s.activeTrashIndex,
      }));
    } catch (e) {
      console.error('Failed to load trash:', e);
    }
  },

  loadTags: async () => {
    try {
      const tags = await tagApi.listTags();
      set((s) => ({
        tags,
        activeTagIndex:
          s.activeTagIndex >= tags.length ? tags.length - 1 : s.activeTagIndex,
      }));
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  },

  restoreNote: async (id: string) => {
    try {
      await trashApi.restoreNote(id);
      await get().loadTrash();
      toast.success(i18n.t('toast.noteRestored'));
    } catch (e) {
      toast.error(String(e));
    }
  },

  permanentlyDeleteTrash: async (id: string) => {
    try {
      await trashApi.permanentlyDelete(id);
      await get().loadTrash();
      toast.success(i18n.t('toast.noteDeletedPermanently'));
    } catch (e) {
      toast.error(String(e));
    }
  },

  emptyTrash: async () => {
    try {
      await trashApi.emptyTrash();
      await get().loadTrash();
      toast.success(i18n.t('toast.trashEmptied'));
    } catch (e) {
      toast.error(String(e));
    }
  },
}));
