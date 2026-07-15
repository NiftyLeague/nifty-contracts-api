// Copies config/ into dist/config/ after the TypeScript build.
//
// Why: `node-config-ts` reads config/default.json from process.cwd()/config at
// runtime. On Vercel the function bundle is assembled by tracing imports from
// the entry point, so `config/` (loaded via fs, not import) is NOT traced and
// would be missing in production. Copying it under `dist/` makes the tracer
// include it, and NODE_CONFIG_TS_DIR=dist/config (set in vercel.json / dashboard)
// points node-config-ts at the copied location.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'config');
const dest = resolve(root, 'dist', 'config');

if (!existsSync(src)) {
  console.warn('[copy-config] config/ not found, skipping');
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-config] copied ${src} -> ${dest}`);
