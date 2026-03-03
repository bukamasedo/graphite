import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { navigateToWikiLink } from '@/lib/wikilinks/resolver';

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

function findWikiLinks(doc: Parameters<typeof DecorationSet.create>[0]) {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    WIKI_LINK_RE.lastIndex = 0;
    let match;
    while ((match = WIKI_LINK_RE.exec(node.text)) !== null) {
      const start = pos + match.index;
      const end = start + match[0].length;
      decorations.push(
        Decoration.inline(start, end, {
          class: 'wiki-link-inline',
          'data-wiki-target': match[1],
        }),
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}

export const WikiLinkDecoration = Extension.create({
  name: 'wikiLinkDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('wikiLinkDecoration'),
        state: {
          init(_, { doc }) {
            return findWikiLinks(doc);
          },
          apply(tr, old) {
            return tr.docChanged ? findWikiLinks(tr.doc) : old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleClick(_view, _pos, event) {
            const target = event.target as HTMLElement;
            const wikiEl = target.closest('.wiki-link-inline');
            if (wikiEl instanceof HTMLElement) {
              const wikiTarget = wikiEl.dataset.wikiTarget;
              if (wikiTarget) {
                navigateToWikiLink(wikiTarget);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
