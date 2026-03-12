import { invoke } from '@tauri-apps/api/core';

export const assetApi = {
  saveImage: (sourcePath: string) =>
    invoke<string>('save_image', { sourcePath }),

  saveImageFromBytes: (bytes: number[], extension: string) =>
    invoke<string>('save_image_from_bytes', { bytes, extension }),

  exportImage: (relativePath: string, destPath: string) =>
    invoke<void>('export_image', { relativePath, destPath }),
};
