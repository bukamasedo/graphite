import { invoke } from '@tauri-apps/api/core';
import type { HotkeyConfig } from '@/types/config';

export const hotkeyApi = {
  readHotkeys: () => invoke<HotkeyConfig>('read_hotkeys'),

  writeHotkeys: (hotkeys: HotkeyConfig) =>
    invoke<void>('write_hotkeys', { hotkeys }),
};
