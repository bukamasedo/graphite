import { invoke } from '@tauri-apps/api/core';

export const appApi = {
  initGraphiteDir: () => invoke<string>('init_graphite_dir'),
};
