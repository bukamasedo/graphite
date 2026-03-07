import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getTrashDir } from './vault.js';

// Rust互換: snake_case キー（serde デフォルト）
export interface TrashEntry {
  id: string;
  original_path: string;
  trash_path: string;
  title: string;
  deleted_at: string;
}

export function readTrashManifest(): TrashEntry[] {
  const manifestPath = join(getTrashDir(), 'manifest.json');
  if (!existsSync(manifestPath)) return [];
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeTrashManifest(entries: TrashEntry[]): void {
  const trashDir = getTrashDir();
  mkdirSync(trashDir, { recursive: true });
  writeFileSync(
    join(trashDir, 'manifest.json'),
    JSON.stringify(entries, null, 2),
    'utf-8'
  );
}
