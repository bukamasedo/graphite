import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parseFrontmatter } from '../frontmatter.js';
import { readTrashManifest, writeTrashManifest } from '../trash.js';
import { ensureWithinVault, getTrashDir, getVaultPath } from '../vault.js';

interface Folder {
  name: string;
  path: string;
  children: Folder[];
  noteCount: number;
}

function countMdFiles(dirPath: string): number {
  let count = 0;
  try {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        count++;
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        count += countMdFiles(join(dirPath, entry.name));
      }
    }
  } catch {
    /* skip unreadable dirs */
  }
  return count;
}

function scanFolder(dirPath: string): Folder[] {
  const folders: Folder[] = [];
  try {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const fullPath = join(dirPath, entry.name);
      folders.push({
        name: entry.name,
        path: fullPath,
        children: scanFolder(fullPath),
        noteCount: countMdFiles(fullPath),
      });
    }
  } catch {
    /* skip unreadable dirs */
  }
  folders.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  return folders;
}

export function listFolders(): Folder[] {
  const vaultPath = getVaultPath();
  if (!existsSync(vaultPath)) return [];
  return scanFolder(vaultPath);
}

export function createFolder(name: string, parent?: string): Folder {
  const vaultPath = getVaultPath();
  const base = parent ? parent : vaultPath;
  const folderPath = join(base, name);

  ensureWithinVault(folderPath);

  if (existsSync(folderPath)) {
    throw new Error('Folder already exists');
  }

  mkdirSync(folderPath, { recursive: true });

  return {
    name,
    path: folderPath,
    children: [],
    noteCount: 0,
  };
}

function collectFiles(dirPath: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isFile()) {
        files.push(fullPath);
      } else if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath));
      }
    }
  } catch {
    /* skip */
  }
  return files;
}

export function deleteFolder(path: string): void {
  ensureWithinVault(path);
  if (!existsSync(path)) throw new Error('Folder does not exist');

  const trashDir = getTrashDir();
  mkdirSync(trashDir, { recursive: true });

  const now = new Date().toISOString();
  const entries = readTrashManifest();
  const files = collectFiles(path);

  for (const filePath of files) {
    const filename = basename(filePath);

    let title = filename;
    if (filePath.endsWith('.md')) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { frontmatter } = parseFrontmatter(content);
        if (frontmatter) title = frontmatter.title;
      } catch {
        /* use filename */
      }
    }

    const id = randomUUID().substring(0, 8);
    const trashPath = join(trashDir, `${id}_${filename}`);
    renameSync(filePath, trashPath);

    entries.push({
      id,
      original_path: filePath,
      trash_path: trashPath,
      title,
      deleted_at: now,
    });
  }

  writeTrashManifest(entries);
  rmSync(path, { recursive: true, force: true });
}

export function renameFolder(path: string, newName: string): string {
  ensureWithinVault(path);

  const parent = dirname(path);
  const newPath = join(parent, newName);
  ensureWithinVault(newPath);

  if (existsSync(newPath)) {
    throw new Error('A folder with this name already exists');
  }

  renameSync(path, newPath);
  return newPath;
}
