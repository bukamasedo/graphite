import { join, basename, dirname, relative } from 'path';
import { randomUUID } from 'crypto';
import { vaultDir, trashDir, resolvePath } from '../utils/paths.js';
import { parseFrontmatter, serializeFrontmatter } from '../utils/frontmatter.js';
import {
  walkMarkdownFiles,
  readTextFile,
  writeTextFile,
  moveFile,
  listDirectories,
} from '../utils/fileSystem.js';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

export async function listNotes(folder?: string) {
  const dir = folder ? join(vaultDir(), folder) : vaultDir();
  const files = await walkMarkdownFiles(dir);
  const notes = [];

  for (const file of files) {
    const content = await readTextFile(file);
    const { data, body } = parseFrontmatter(content);
    const relPath = relative(vaultDir(), file);
    const folderPath = dirname(relPath) === '.' ? '' : dirname(relPath);

    notes.push({
      path: relPath,
      title: data.title || basename(file, '.md'),
      folder: folderPath,
      tags: data.tags,
      created: data.created,
      modified: data.modified,
      pinned: data.pinned,
      preview: body.slice(0, 120).replace(/\n/g, ' ').trim(),
    });
  }

  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.modified.localeCompare(a.modified);
  });

  return notes;
}

export async function getNote(path: string) {
  const fullPath = resolvePath(path);
  const content = await readTextFile(fullPath);
  const { data, body } = parseFrontmatter(content);
  const relPath = relative(vaultDir(), fullPath);

  return {
    path: relPath,
    title: data.title || basename(fullPath, '.md'),
    content: body,
    tags: data.tags,
    created: data.created,
    modified: data.modified,
    pinned: data.pinned,
  };
}

export async function createNote(
  title: string,
  content?: string,
  folder?: string,
  tags?: string[],
) {
  const dir = folder ? join(vaultDir(), folder) : vaultDir();
  await mkdir(dir, { recursive: true });

  let filename = `${title}.md`;
  let fullPath = join(dir, filename);
  let counter = 1;
  while (existsSync(fullPath)) {
    filename = `${title} ${counter}.md`;
    fullPath = join(dir, filename);
    counter++;
  }

  const now = new Date().toISOString();
  const fm = {
    title,
    tags: tags || [],
    created: now,
    modified: now,
    pinned: false,
  };

  const body = content || '';
  const fileContent = serializeFrontmatter(fm, body);
  await writeTextFile(fullPath, fileContent);

  return {
    path: relative(vaultDir(), fullPath),
    title,
    content: body,
    tags: fm.tags,
    created: now,
    modified: now,
  };
}

export async function updateNote(
  path: string,
  content?: string,
  title?: string,
  tags?: string[],
) {
  const fullPath = resolvePath(path);
  const existing = await readTextFile(fullPath);
  const { data, body } = parseFrontmatter(existing);

  if (title !== undefined) data.title = title;
  if (tags !== undefined) data.tags = tags;
  data.modified = new Date().toISOString();

  const newBody = content !== undefined ? content : body;
  const fileContent = serializeFrontmatter(data, newBody);
  await writeTextFile(fullPath, fileContent);

  return {
    path: relative(vaultDir(), fullPath),
    title: data.title,
    content: newBody,
    tags: data.tags,
    modified: data.modified,
  };
}

export async function deleteNote(path: string) {
  const fullPath = resolvePath(path);
  const trash = trashDir();
  await mkdir(trash, { recursive: true });

  const filename = basename(fullPath);
  const id = randomUUID().slice(0, 8);
  const trashPath = join(trash, `${id}_${filename}`);
  await moveFile(fullPath, trashPath);
}

export async function searchNotes(query: string) {
  const files = await walkMarkdownFiles(vaultDir());
  const queryLower = query.toLowerCase();
  const results = [];

  for (const file of files) {
    const content = await readTextFile(file);
    const { data, body } = parseFrontmatter(content);
    const title = data.title || basename(file, '.md');
    const matches: { line: number; content: string }[] = [];

    body.split('\n').forEach((line, idx) => {
      if (line.toLowerCase().includes(queryLower)) {
        matches.push({ line: idx + 1, content: line });
      }
    });

    if (title.toLowerCase().includes(queryLower) || matches.length > 0) {
      results.push({
        path: relative(vaultDir(), file),
        title,
        matches: matches.slice(0, 5),
      });
    }
  }

  return results;
}

export async function listFolders() {
  const dirs = await listDirectories(vaultDir());
  return dirs.map((d) => ({
    name: d.name,
    path: relative(vaultDir(), d.path),
  }));
}

export async function listTags() {
  const files = await walkMarkdownFiles(vaultDir());
  const tagCounts: Record<string, number> = {};

  for (const file of files) {
    const content = await readTextFile(file);
    const { data } = parseFrontmatter(content);
    for (const tag of data.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
