import { existsSync, readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { parseFrontmatter } from '../frontmatter.js';
import { getVaultPath, isHiddenPath } from '../vault.js';

interface TagInfo {
  name: string;
  count: number;
}

export function listTags(): TagInfo[] {
  const vaultPath = getVaultPath();
  if (!existsSync(vaultPath)) return [];

  const files = globSync('**/*.md', { cwd: vaultPath, absolute: true });
  const tagCounts = new Map<string, number>();

  for (const filePath of files) {
    if (isHiddenPath(filePath.substring(vaultPath.length))) continue;

    try {
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      if (frontmatter) {
        for (const tag of frontmatter.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
    } catch {
      /* skip unreadable files */
    }
  }

  const tags: TagInfo[] = Array.from(tagCounts.entries()).map(
    ([name, count]) => ({ name, count })
  );
  tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return tags;
}
