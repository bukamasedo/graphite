import { invoke } from '@tauri-apps/api/core';

export interface NativeMenuItemDef {
  id: string;
  text: string;
  accelerator?: string;
  action: () => void;
}

export interface NativeMenuSeparator {
  separator: true;
}

export type NativeMenuEntry = NativeMenuItemDef | NativeMenuSeparator;

function isSeparator(entry: NativeMenuEntry): entry is NativeMenuSeparator {
  return 'separator' in entry;
}

export async function showNativeContextMenu(entries: NativeMenuEntry[]) {
  const actions = new Map<string, () => void>();
  const items = entries.map((entry) => {
    if (isSeparator(entry)) {
      return { separator: true };
    }
    actions.set(entry.id, entry.action);
    return {
      id: entry.id,
      text: entry.text,
      accelerator: entry.accelerator,
    };
  });

  const selectedId = await invoke<string | null>('show_context_menu', {
    items,
  });
  if (selectedId) {
    actions.get(selectedId)?.();
  }
}
