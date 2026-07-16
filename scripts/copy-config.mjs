// Copies config/ next to the TypeScript sources so `tsc` compiles it into
// dist/config/ as a TRACED, importable asset.
//
// Why: `node-config-ts` reads config/default.json from disk at runtime (fs,
// not import), so Vercel's bundler never includes it and the function crashes
// with `config.imx is undefined`. Copying into src/ makes tsc emit it under
// dist/config/, and a traced `import` of the JSON (see src/config.ts) makes
// the bundler include dist/config/default.json in the deployed bundle.
// NODE_CONFIG_TS_DIR=dist/config (set in vercel.json) points node-config-ts
// at that location.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'config');
const dest = resolve(root, 'src', 'config');

if (!existsSync(src)) {
  console.warn('[copy-config] config/ not found, skipping');
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-config] copied ${src} -> ${dest}`);
