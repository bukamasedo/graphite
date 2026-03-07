import { build } from 'esbuild';
import { execSync } from 'child_process';
import { cpSync, chmodSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Detect the SEA fuse sentinel from the node binary.
 * The fuse format is NODE_SEA_FUSE_<32 hex chars>.
 */
function detectSentinelFuse(nodeBinaryPath) {
  const buf = readFileSync(nodeBinaryPath);
  const prefix = 'NODE_SEA_FUSE_';
  const idx = buf.indexOf(prefix);
  if (idx === -1) {
    throw new Error('Could not find NODE_SEA_FUSE sentinel in the node binary. SEA may not be supported.');
  }
  // The fuse is prefix + 32 hex chars
  const fuse = buf.slice(idx, idx + prefix.length + 32).toString();
  return fuse;
}

// Step 1: TypeScript compile
console.log('Compiling TypeScript...');
execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' });

// Step 2: Bundle to single CJS file (Node SEA requires CJS)
console.log('Bundling with esbuild...');
await build({
  entryPoints: [resolve(__dirname, 'dist/index.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: resolve(__dirname, 'dist/bundle.cjs'),
});

// Step 3: Generate SEA blob
console.log('Generating SEA blob...');
execSync('node --experimental-sea-config sea-config.json', {
  cwd: __dirname,
  stdio: 'inherit',
});

// Step 4: Copy node binary and inject blob
const nodePath = process.execPath;
const outputName = 'graphite-mcp';
const outputPath = resolve(__dirname, `dist/${outputName}`);

const sentinelFuse = detectSentinelFuse(nodePath);
console.log(`Detected sentinel fuse: ${sentinelFuse}`);

console.log('Creating standalone binary...');
cpSync(nodePath, outputPath);
chmodSync(outputPath, 0o755);

// Remove signature (macOS)
if (process.platform === 'darwin') {
  try {
    execSync(`codesign --remove-signature "${outputPath}"`, { stdio: 'inherit' });
  } catch {
    console.warn('codesign --remove-signature failed, continuing...');
  }
}

// Inject SEA blob
execSync(
  `npx postject "${outputPath}" NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse ${sentinelFuse} --macho-segment-name NODE_SEA`,
  { cwd: __dirname, stdio: 'inherit' }
);

// Re-sign (macOS)
if (process.platform === 'darwin') {
  try {
    execSync(`codesign --sign - "${outputPath}"`, { stdio: 'inherit' });
  } catch {
    console.warn('codesign --sign failed, continuing...');
  }
}

console.log(`Built: ${outputPath}`);
