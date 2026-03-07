import { existsSync, readFileSync } from 'node:fs';
import { parse as parsePath } from 'node:path';
import { globSync } from 'glob';
import { parseFrontmatter } from '../frontmatter.js';
import { getVaultPath, isHiddenPath } from '../vault.js';

interface SearchMatch {
  line: number;
  content: string;
  start: number;
  end: number;
}

interface SearchResult {
  path: string;
  title: string;
  matches: SearchMatch[];
}

export function searchNotes(query: string): SearchResult[] {
  const vaultPath = getVaultPath();
  if (!existsSync(vaultPath) || !query) return [];

  const queryLower = query.toLowerCase();
  const files = globSync('**/*.md', { cwd: vaultPath, absolute: true });
  const results: SearchResult[] = [];

  for (const filePath of files) {
    if (isHiddenPath(filePath.substring(vaultPath.length))) continue;

    try {
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);
      const title = frontmatter?.title ?? parsePath(filePath).name;

      const matches: SearchMatch[] = [];
      const lines = body.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        let start = 0;
        while (true) {
          const idx = lineLower.indexOf(queryLower, start);
          if (idx === -1) break;
          matches.push({
            line: i + 1,
            content: line,
            start: idx,
            end: idx + query.length,
          });
          start = idx + query.length;
        }
      }

      // Also check title
      if (title.toLowerCase().includes(queryLower) && matches.length === 0) {
        matches.push({ line: 0, content: title, start: 0, end: 0 });
      }

      if (matches.length > 0) {
        results.push({ path: filePath, title, matches });
      }
    } catch {
      /* skip unreadable files */
    }
  }

  return results;
}
