import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { open } from '@tauri-apps/plugin-shell';

export const ExternalLinkHandler = Extension.create({
  name: 'externalLinkHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('externalLinkHandler'),
        props: {
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');
            if (!anchor) return false;

            const href = anchor.getAttribute('href') || '';
            if (href.startsWith('http://') || href.startsWith('https://')) {
              event.preventDefault();
              open(href);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
