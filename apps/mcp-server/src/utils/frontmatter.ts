import matter from 'gray-matter';

export interface NoteFrontmatter {
  title: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
}

export function parseFrontmatter(content: string): { data: NoteFrontmatter; body: string } {
  const { data, content: body } = matter(content);
  return {
    data: {
      title: data.title || '',
      tags: data.tags || [],
      created: data.created || new Date().toISOString(),
      modified: data.modified || new Date().toISOString(),
      pinned: data.pinned || false,
    },
    body,
  };
}

export function serializeFrontmatter(fm: NoteFrontmatter, body: string): string {
  return matter.stringify(body, fm);
}
