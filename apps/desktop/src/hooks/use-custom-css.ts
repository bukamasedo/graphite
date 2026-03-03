import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const STYLE_ID = 'graphite-custom-css';

export function useCustomCSS() {
  useEffect(() => {
    invoke<string>('read_custom_css')
      .then((css) => {
        let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
        if (!el) {
          el = document.createElement('style');
          el.id = STYLE_ID;
          document.head.appendChild(el);
        }
        el.textContent = css;
      })
      .catch(() => {
        // No custom CSS file — ignore
      });
  }, []);
}
