import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve } from 'node:path';

export function getVaultPath(): string {
  const defaultPath = join(homedir(), 'Graphite');
  const configPath = join(defaultPath, '.graphite', 'config.json');

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.vaultPath && typeof config.vaultPath === 'string') {
        return resolve(config.vaultPath);
      }
    } catch {
      // Fall through to default
    }
  }

  return defaultPath;
}

export function getTrashDir(): string {
  return join(getVaultPath(), '.graphite', 'trash');
}

export function ensureWithinVault(targetPath: string): string {
  const vaultPath = getVaultPath();

  if (!existsSync(vaultPath)) {
    throw new Error('Vault directory does not exist');
  }

  const vaultReal = realpathSync(vaultPath);

  // Reject explicit parent directory traversal
  if (targetPath.includes('..')) {
    throw new Error('Access denied: path traversal detected');
  }

  // Resolve the path
  const resolved = existsSync(targetPath)
    ? realpathSync(targetPath)
    : resolve(targetPath);

  if (!resolved.startsWith(vaultReal)) {
    throw new Error('Access denied: path is outside the vault directory');
  }

  return resolved;
}

export function folderFromPath(notePath: string, vaultPath: string): string {
  const rel = relative(vaultPath, notePath);
  const lastSlash = rel.lastIndexOf('/');
  return lastSlash >= 0 ? rel.substring(0, lastSlash) : '';
}

export function isHiddenPath(filePath: string): boolean {
  return filePath.split('/').some((segment) => segment.startsWith('.'));
}
