import matter from 'gray-matter';

export interface NoteFrontmatter {
  title: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
}

export interface NoteListItem {
  id: string;
  title: string;
  path: string;
  folder: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
  preview: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  path: string;
  folder: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
}

export function parseFrontmatter(content: string): {
  frontmatter: NoteFrontmatter | null;
  body: string;
} {
  try {
    const { data, content: body } = matter(content);
    if (data && typeof data.title === 'string') {
      return {
        frontmatter: {
          title: data.title,
          tags: Array.isArray(data.tags) ? data.tags : [],
          created: data.created ?? new Date().toISOString(),
          modified: data.modified ?? new Date().toISOString(),
          pinned: data.pinned ?? false,
        },
        body,
      };
    }
    return { frontmatter: null, body: content };
  } catch {
    return { frontmatter: null, body: content };
  }
}

export function serializeFrontmatter(
  fm: NoteFrontmatter,
  body: string
): string {
  const yamlLines = [
    `title: ${JSON.stringify(fm.title)}`,
    `tags:${fm.tags.length === 0 ? ' []' : ''}`,
    ...fm.tags.map((t) => `  - ${t}`),
    `created: ${JSON.stringify(fm.created)}`,
    `modified: ${JSON.stringify(fm.modified)}`,
    `pinned: ${fm.pinned}`,
  ];
  return `---\n${yamlLines.join('\n')}\n---\n${body}`;
}

export function extractPreview(body: string, maxLen: number): string {
  const lines = body
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('```')
      );
    })
    .slice(0, 3);

  const preview = lines.join(' ');
  return preview.length > maxLen
    ? `${preview.substring(0, maxLen)}...`
    : preview;
}

export function createFrontmatter(title: string): NoteFrontmatter {
  const now = new Date().toISOString();
  return { title, tags: [], created: now, modified: now, pinned: false };
}
