import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, parse as parsePath } from 'node:path';
import { globSync } from 'glob';
import {
  createFrontmatter,
  extractPreview,
  type Note,
  type NoteListItem,
  parseFrontmatter,
  serializeFrontmatter,
} from '../frontmatter.js';
import {
  readTrashManifest,
  type TrashEntry,
  writeTrashManifest,
} from '../trash.js';
import {
  ensureWithinVault,
  folderFromPath,
  getTrashDir,
  getVaultPath,
  isHiddenPath,
} from '../vault.js';

export function listNotes(folder?: string, tag?: string): NoteListItem[] {
  const vaultPath = getVaultPath();

  const searchDir = folder
    ? ensureWithinVault(join(vaultPath, folder))
    : vaultPath;

  if (!existsSync(searchDir)) return [];

  const files = globSync('**/*.md', { cwd: searchDir, absolute: true });
  const notes: NoteListItem[] = [];

  for (const filePath of files) {
    if (isHiddenPath(filePath.substring(vaultPath.length))) continue;

    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const fm = frontmatter ?? createFrontmatter(parsePath(filePath).name);

    if (tag != null && !fm.tags.includes(tag)) continue;

    notes.push({
      id: filePath,
      title: fm.title,
      path: filePath,
      folder: folderFromPath(filePath, vaultPath),
      tags: fm.tags,
      created: fm.created,
      modified: fm.modified,
      pinned: fm.pinned,
      preview: extractPreview(body, 120),
    });
  }

  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.modified.localeCompare(a.modified);
  });

  return notes;
}

export function readNote(path: string): Note {
  const vaultPath = getVaultPath();
  ensureWithinVault(path);

  const content = readFileSync(path, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter ?? createFrontmatter(parsePath(path).name);

  return {
    id: path,
    title: fm.title,
    content: body,
    path,
    folder: folderFromPath(path, vaultPath),
    tags: fm.tags,
    created: fm.created,
    modified: fm.modified,
    pinned: fm.pinned,
  };
}

export function createNote(folder?: string, title?: string): Note {
  const vaultPath = getVaultPath();
  const noteTitle = title ?? 'Untitled';

  const dir = folder ? ensureWithinVault(join(vaultPath, folder)) : vaultPath;

  mkdirSync(dir, { recursive: true });

  let filename = `${noteTitle}.md`;
  let notePath = join(dir, filename);
  let counter = 1;
  while (existsSync(notePath)) {
    filename = `${noteTitle} ${counter}.md`;
    notePath = join(dir, filename);
    counter++;
  }

  const fm = createFrontmatter(noteTitle);
  writeFileSync(notePath, serializeFrontmatter(fm, '\n'), 'utf-8');

  return {
    id: notePath,
    title: noteTitle,
    content: '',
    path: notePath,
    folder: folder ?? '',
    tags: [],
    created: fm.created,
    modified: fm.modified,
    pinned: false,
  };
}

export function writeNote(
  path: string,
  content: string,
  title?: string,
  tags?: string[],
  pinned?: boolean
): void {
  ensureWithinVault(path);

  if (!existsSync(path)) {
    throw new Error('Note file not found (may have been renamed)');
  }

  const existing = readFileSync(path, 'utf-8');
  const { frontmatter } = parseFrontmatter(existing);
  const fm = frontmatter ?? createFrontmatter(parsePath(path).name);

  if (title != null) fm.title = title;
  if (tags != null) fm.tags = tags;
  if (pinned != null) fm.pinned = pinned;
  fm.modified = new Date().toISOString();

  writeFileSync(path, serializeFrontmatter(fm, content), 'utf-8');
}

export function deleteNote(path: string): void {
  ensureWithinVault(path);

  const trashDir = getTrashDir();
  mkdirSync(trashDir, { recursive: true });

  const filename = basename(path);

  let title = parsePath(path).name;
  try {
    const content = readFileSync(path, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);
    if (frontmatter) title = frontmatter.title;
  } catch {
    /* use filename as title */
  }

  const id = randomUUID().substring(0, 8);
  const trashPath = join(trashDir, `${id}_${filename}`);

  renameSync(path, trashPath);

  const entries = readTrashManifest();
  entries.push({
    id,
    original_path: path,
    trash_path: trashPath,
    title,
    deleted_at: new Date().toISOString(),
  });
  writeTrashManifest(entries);
}

export function renameNote(path: string, newTitle: string): string {
  ensureWithinVault(path);

  const dir = dirname(path);
  const newPath = join(dir, `${newTitle}.md`);
  ensureWithinVault(newPath);

  if (existsSync(newPath)) {
    throw new Error('A note with this name already exists');
  }

  const content = readFileSync(path, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter ?? createFrontmatter(newTitle);
  fm.title = newTitle;
  fm.modified = new Date().toISOString();

  writeFileSync(path, serializeFrontmatter(fm, body), 'utf-8');
  renameSync(path, newPath);

  return newPath;
}

export function moveNote(notePath: string, targetFolder: string): string {
  const vaultPath = getVaultPath();
  ensureWithinVault(notePath);

  if (!existsSync(notePath)) {
    throw new Error('Source note does not exist');
  }

  const filename = basename(notePath);
  const targetDir = targetFolder
    ? ensureWithinVault(join(vaultPath, targetFolder))
    : vaultPath;

  if (!existsSync(targetDir)) {
    throw new Error('Target folder does not exist');
  }

  const dest = join(targetDir, filename);

  if (notePath === dest) return dest;

  if (existsSync(dest)) {
    throw new Error(
      'A note with this name already exists in the target folder'
    );
  }

  renameSync(notePath, dest);
  return dest;
}

interface TrashItem {
  id: string;
  title: string;
  original_path: string;
  trash_path: string;
  deleted_at: string;
  preview: string;
}

export function listTrash(): TrashItem[] {
  const entries = readTrashManifest();
  const liveEntries: TrashEntry[] = [];
  const items: TrashItem[] = [];

  for (const e of entries) {
    if (!existsSync(e.trash_path)) continue;
    liveEntries.push(e);

    let preview = '';
    try {
      const content = readFileSync(e.trash_path, 'utf-8');
      const { body } = parseFrontmatter(content);
      preview = extractPreview(body, 120);
    } catch {
      /* skip */
    }

    items.push({
      id: e.id,
      title: e.title,
      original_path: e.original_path,
      trash_path: e.trash_path,
      deleted_at: e.deleted_at,
      preview,
    });
  }

  if (liveEntries.length !== entries.length) {
    writeTrashManifest(liveEntries);
  }

  items.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
  return items;
}

export function restoreNote(id: string): void {
  const entries = readTrashManifest();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error('Trash item not found');

  if (!existsSync(entry.trash_path)) {
    writeTrashManifest(entries.filter((e) => e.id !== id));
    throw new Error('Trash file no longer exists');
  }

  const originalDir = dirname(entry.original_path);
  mkdirSync(originalDir, { recursive: true });

  let restorePath = entry.original_path;
  if (existsSync(restorePath)) {
    const { name } = parsePath(restorePath);
    let counter = 1;
    while (existsSync(restorePath)) {
      restorePath = join(originalDir, `${name} (${counter}).md`);
      counter++;
    }
  }

  renameSync(entry.trash_path, restorePath);
  writeTrashManifest(entries.filter((e) => e.id !== id));
}

export function permanentlyDelete(id: string): void {
  const entries = readTrashManifest();
  const entry = entries.find((e) => e.id === id);

  if (entry && existsSync(entry.trash_path)) {
    unlinkSync(entry.trash_path);
  }

  writeTrashManifest(entries.filter((e) => e.id !== id));
}

export function emptyTrash(): void {
  const entries = readTrashManifest();
  for (const entry of entries) {
    if (existsSync(entry.trash_path)) {
      try {
        unlinkSync(entry.trash_path);
      } catch {
        /* skip */
      }
    }
  }
  writeTrashManifest([]);
}
