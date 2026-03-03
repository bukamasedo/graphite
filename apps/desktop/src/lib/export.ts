import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { renderMarkdown } from '@/lib/markdown/pipeline';

export type ExportFormat = 'markdown' | 'html';

export async function exportNote(
  title: string,
  content: string,
  format: ExportFormat,
): Promise<boolean> {
  const ext = format === 'html' ? 'html' : 'md';
  const filterName = format === 'html' ? 'HTML' : 'Markdown';

  const path = await save({
    defaultPath: `${title}.${ext}`,
    filters: [{ name: filterName, extensions: [ext] }],
  });

  if (!path) return false;

  const output = format === 'html'
    ? wrapHtml(title, renderMarkdown(content))
    : content;

  await invoke('write_export_file', { path, content: output });
  return true;
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
code { font-family: 'SF Mono', Menlo, monospace; font-size: 0.9em; }
blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
img { max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
