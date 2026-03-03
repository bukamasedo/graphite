import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#2f81f7',
    primaryTextColor: '#e6edf3',
    lineColor: '#484f58',
  },
});

let renderCounter = 0;

async function renderMermaidBlocks(root: HTMLElement) {
  // Only render new (unrendered) mermaid blocks
  const codeBlocks = root.querySelectorAll('pre > code.language-mermaid');
  for (const codeEl of codeBlocks) {
    const pre = codeEl.parentElement;
    if (!pre || pre.dataset.mermaidRendered) continue;
    pre.dataset.mermaidRendered = 'true';

    const source = codeEl.textContent || '';
    try {
      const id = `mermaid-${Date.now()}-${renderCounter++}`;
      const { svg } = await mermaid.render(id, source);
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-diagram';
      wrapper.innerHTML = svg;
      // Insert rendered diagram after the pre block
      pre.style.display = 'none';
      pre.insertAdjacentElement('afterend', wrapper);
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  }

  // Clean up orphaned diagrams (whose pre block was removed)
  root.querySelectorAll('.mermaid-diagram').forEach((el) => {
    const pre = el.previousElementSibling as HTMLElement | null;
    if (!pre || pre.tagName !== 'PRE') {
      el.remove();
    }
  });
}

export const MermaidRenderer = Extension.create({
  name: 'mermaidRenderer',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mermaidRenderer'),
        view(editorView) {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const render = () => renderMermaidBlocks(editorView.dom);
          // Initial render
          requestAnimationFrame(render);
          return {
            update(view, prevState) {
              // Skip if document hasn't changed
              if (view.state.doc.eq(prevState.doc)) return;
              clearTimeout(timer);
              timer = setTimeout(() => requestAnimationFrame(render), 500);
            },
            destroy() {
              clearTimeout(timer);
            },
          };
        },
      }),
    ];
  },
});
