import { cpSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const target = process.env.TARGET_TRIPLE || getLocalTargetTriple();
const ext = target.includes('windows') ? '.exe' : '';
const src = resolve(root, `mcp-server/dist/graphite-mcp${ext}`);
const dest = resolve(root, `src-tauri/binaries/graphite-mcp-${target}${ext}`);

mkdirSync(resolve(root, 'src-tauri/binaries'), { recursive: true });
cpSync(src, dest);
console.log(`Placed MCP binary: ${dest}`);

function getLocalTargetTriple() {
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
  const platformMap = {
    darwin: `${arch}-apple-darwin`,
    linux: `${arch}-unknown-linux-gnu`,
    win32: `${arch}-pc-windows-msvc`,
  };
  return platformMap[process.platform] || `${arch}-unknown-${process.platform}`;
}
