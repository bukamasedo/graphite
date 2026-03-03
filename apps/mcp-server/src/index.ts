#!/usr/bin/env node
import { createServer } from './server.js';

async function main() {
  const server = createServer();
  await server.start();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
