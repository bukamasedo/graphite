import { resolveWikiLink } from './resolver';

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

interface TextNode {
  type: 'text';
  value: string;
}

interface HtmlNode {
  type: 'html';
  value: string;
}

interface RemarkNode {
  type: string;
  value?: string;
  children?: RemarkNode[];
}

interface Parent {
  children: (TextNode | HtmlNode | RemarkNode)[];
}

function visitText(tree: RemarkNode): void {
  if (!tree || !tree.children) return;

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];

    if (node.type === 'text') {
      const value = node.value as string;
      const matches = [...value.matchAll(WIKI_LINK_RE)];
      if (matches.length === 0) continue;

      const children: (TextNode | HtmlNode)[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const fullMatch = match[0];
        const inner = match[1];
        const start = match.index ?? 0;

        if (start > lastIndex) {
          children.push({ type: 'text', value: value.slice(lastIndex, start) });
        }

        const pipeIndex = inner.indexOf('|');
        const target =
          pipeIndex !== -1 ? inner.slice(0, pipeIndex).trim() : inner.trim();
        const display =
          pipeIndex !== -1 ? inner.slice(pipeIndex + 1).trim() : inner.trim();

        const resolved = resolveWikiLink(target);
        const brokenClass = resolved.exists ? '' : ' broken';

        children.push({
          type: 'html',
          value: `<a href="#" class="wiki-link${brokenClass}" data-wiki-target="${encodeURIComponent(target)}">${display}</a>`,
        });

        lastIndex = start + fullMatch.length;
      }

      if (lastIndex < value.length) {
        children.push({ type: 'text', value: value.slice(lastIndex) });
      }

      (tree as Parent).children.splice(i, 1, ...children);
      i += children.length - 1;
    } else if (node.children) {
      visitText(node);
    }
  }
}

export default function remarkWikiLinks() {
  return (tree: RemarkNode) => {
    visitText(tree);
  };
}
