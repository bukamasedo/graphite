import { convertFileSrc } from '@tauri-apps/api/core';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageView } from './image-view';

interface GraphiteImageOptions extends ImageOptions {
  vaultPath: string;
}

export const GraphiteImage = Image.extend<GraphiteImageOptions>({
  draggable: false,

  addOptions() {
    return {
      ...this.parent?.(),
      vaultPath: '',
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          // Parse from style="width: XX%"
          const styleWidth = element.style.width;
          if (styleWidth?.endsWith('%')) {
            return styleWidth.replace('%', '');
          }
          return null;
        },
        renderHTML: (attributes: Record<string, string | null>) => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}%` };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },

  renderHTML({ HTMLAttributes }) {
    const { src, width, ...rest } = HTMLAttributes;
    let resolvedSrc = src;

    if (src && !src.startsWith('http') && !src.startsWith('asset://')) {
      const vaultPath = this.options.vaultPath;
      if (vaultPath) {
        resolvedSrc = convertFileSrc(`${vaultPath}/${src}`);
      }
    }

    const style = width ? `width: ${width}%` : undefined;

    return [
      'img',
      {
        ...rest,
        src: resolvedSrc,
        ...(style ? { style } : {}),
      },
    ];
  },
});
