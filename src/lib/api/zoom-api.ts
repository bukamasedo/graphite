import { getCurrentWebview } from '@tauri-apps/api/webview';

export const zoomApi = {
  setZoom: (scaleFactor: number) => getCurrentWebview().setZoom(scaleFactor),
};
