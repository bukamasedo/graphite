import type { TrashItem } from '@/types/note';

export interface TrashGroup {
  folder: string; // '' = root-level items
  label: string; // 'All Notes' or folder name
  count: number;
  items: TrashItem[];
}

export function computeTrashGroups(
  items: TrashItem[],
  vaultPath: string
): TrashGroup[] {
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
    const folderItems = groupMap.get(key) ?? [];
    groups.push({
      folder: key,
      label: key.split('/').pop() || key,
      count: folderItems.length,
      items: folderItems,
    });
  }

  return groups;
}
