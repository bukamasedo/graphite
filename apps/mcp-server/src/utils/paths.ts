import { homedir } from 'os';
import { join } from 'path';

export function vaultDir(): string {
  return join(homedir(), 'Graphite');
}

export function configDir(): string {
  return join(vaultDir(), '.graphite');
}

export function trashDir(): string {
  return join(configDir(), 'trash');
}

export function resolvePath(relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath;
  return join(vaultDir(), relativePath);
}
