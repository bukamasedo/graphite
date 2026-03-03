import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';

const INLINE_MATH_RE = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;
const BLOCK_MATH_RE = /\$\$([\s\S]+?)\$\$/g;

interface MathMatch {
  from: number;
  to: number;
  isBlock: boolean;
}

interface MathPluginState {
  decorations: DecorationSet;
  matches: MathMatch[];
}

function collectMatches(doc: PmNode): MathMatch[] {
  const matches: MathMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    // Block math $$...$$
    BLOCK_MATH_RE.lastIndex = 0;
    let m;
    while ((m = BLOCK_MATH_RE.exec(node.text)) !== null) {
      matches.push({
        from: pos + m.index,
        to: pos + m.index + m[0].length,
        isBlock: true,
      });
    }

    // Inline math $...$
    INLINE_MATH_RE.lastIndex = 0;
    while ((m = INLINE_MATH_RE.exec(node.text)) !== null) {
      const from = pos + m.index;
      const to = from + m[0].length;

      // Skip if overlapping with a block math match
      const overlaps = matches.some(
        (bm) => bm.isBlock && bm.from <= from && bm.to >= to,
      );
      if (overlaps) continue;

      matches.push({ from, to, isBlock: false });
    }
  });

  matches.sort((a, b) => a.from - b.from);
  return matches;
}

function buildDecorations(
  doc: PmNode,
  matches: MathMatch[],
  selectionFrom: number,
  selectionTo: number,
): DecorationSet {
  const decorations: Decoration[] = [];
  for (const match of matches) {
    const cursorInside = selectionFrom >= match.from && selectionTo <= match.to;
    const cls = cursorInside
      ? 'math-source'
      : match.isBlock
        ? 'math-block-highlight'
        : 'math-inline-highlight';
    decorations.push(Decoration.inline(match.from, match.to, { class: cls }));
  }
  return DecorationSet.create(doc, decorations);
}

export const MathDecoration = Extension.create({
  name: 'mathDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mathDecoration'),
        state: {
          init(_, { doc }): MathPluginState {
            const matches = collectMatches(doc);
            return {
              matches,
              decorations: buildDecorations(doc, matches, 0, 0),
            };
          },
          apply(tr, old: MathPluginState): MathPluginState {
            if (tr.docChanged) {
              // Document changed: rescan for matches
              const matches = collectMatches(tr.doc);
              const { from, to } = tr.selection;
              return {
                matches,
                decorations: buildDecorations(tr.doc, matches, from, to),
              };
            }
            if (tr.selectionSet) {
              // Selection only: reuse cached matches, rebuild decorations with new cursor
              const { from, to } = tr.selection;
              return {
                matches: old.matches,
                decorations: buildDecorations(tr.doc, old.matches, from, to),
              };
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return (this.getState(state) as MathPluginState | undefined)?.decorations;
          },
        },
      }),
    ];
  },
});
