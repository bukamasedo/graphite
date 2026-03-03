import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import remarkWikiLinks from '@/lib/wikilinks/remark-plugin';

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkWikiLinks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex)
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeStringify);

export function renderMarkdown(content: string): string {
  try {
    const result = processor.processSync(content);
    return String(result);
  } catch (e) {
    console.error('Markdown render error:', e);
    return `<p style="color: #ff5370;">Error rendering markdown</p>`;
  }
}
