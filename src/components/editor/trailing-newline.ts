import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Ensures the document always ends with an empty paragraph,
 * similar to how code editors always have a trailing newline.
 */
export const TrailingNewline = Extension.create({
  name: 'trailingNewline',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('trailingNewline');

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction(_transactions, _oldState, newState) {
          const { doc, tr, schema } = newState;
          const lastNode = doc.lastChild;
          const isEmptyParagraph =
            lastNode?.type.name === 'paragraph' && lastNode.childCount === 0;

          if (isEmptyParagraph) return null;

          const paragraph = schema.nodes.paragraph.create();
          tr.insert(doc.content.size, paragraph);
          return tr;
        },
      }),
    ];
  },
});
