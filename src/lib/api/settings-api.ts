import { invoke } from '@tauri-apps/api/core';
import type { GraphiteConfig } from '@/types/config';

export const settingsApi = {
  readSettings: () => invoke<Record<string, unknown>>('read_settings'),

  writeSettings: (settings: GraphiteConfig) =>
    invoke<void>('write_settings', { settings }),
};
