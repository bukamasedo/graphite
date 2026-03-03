import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { TrashItem, Tag } from '@graphite/shared';

export type SidebarSection = 'folders' | 'trash' | 'tags';

export interface TrashGroup {
  folder: string;   // '' = root-level items
  label: string;    // 'All Notes' or folder name
  count: number;
  items: TrashItem[];
}

export function computeTrashGroups(items: TrashItem[], vaultPath: string): TrashGroup[] {
  if (items.length === 0) return [];

  const groupMap = new Map<string, TrashItem[]>();

  for (const item of items) {
    // Extract folder from original_path relative to vault
    let relative = item.original_path;
    if (relative.startsWith(vaultPath)) {
      relative = relative.slice(vaultPath.length);
      if (relative.startsWith('/')) relative = relative.slice(1);
    }
    const lastSlash = relative.lastIndexOf('/');
    const folder = lastSlash > 0 ? relative.slice(0, lastSlash) : '';

    const existing = groupMap.get(folder);
    if (existing) {
      existing.push(item);
    } else {
      groupMap.set(folder, [item]);
    }
  }

  const groups: TrashGroup[] = [];

  // "All Notes" group always first (contains all items)
  groups.push({
    folder: '',
    label: 'All Notes',
    count: items.length,
    items,
  });

  // Add folder-specific groups sorted alphabetically
  const folderKeys = Array.from(groupMap.keys())
    .filter((k) => k !== '')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  for (const key of folderKeys) {
    const folderItems = groupMap.get(key)!;
    groups.push({
      folder: key,
      label: key.split('/').pop() || key,
      count: folderItems.length,
      items: folderItems,
    });
  }

  // Only add root items as a separate group if there are also folder groups
  const rootItems = groupMap.get('');
  if (rootItems && folderKeys.length > 0) {
    // Root items are already included in "All Notes", no separate group needed
    // unless we want to separate them — for now "All Notes" covers root items
  }

  return groups;
}

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
}

export const useSidebarStore = create<SidebarState>((set) => ({
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
      const trashItems = await invoke<TrashItem[]>('list_trash');
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
      const tags = await invoke<Tag[]>('list_tags');
      set((s) => ({
        tags,
        activeTagIndex:
          s.activeTagIndex >= tags.length ? tags.length - 1 : s.activeTagIndex,
      }));
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  },
}));
