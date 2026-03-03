import { invoke } from '@tauri-apps/api/core';

export const menuApi = {
  rebuildMenu: (labels: Record<string, string>) =>
    invoke<void>('rebuild_menu', { labels }),
};
