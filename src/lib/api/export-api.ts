import { invoke } from '@tauri-apps/api/core';

export const exportApi = {
  writeExportFile: (path: string, content: string) =>
    invoke<void>('write_export_file', { path, content }),
};
