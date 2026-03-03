import { invoke } from '@tauri-apps/api/core';

export const cssApi = {
  openCustomCssFile: () => invoke<string>('open_custom_css_file'),
  readCustomCss: () => invoke<string>('read_custom_css'),
};
