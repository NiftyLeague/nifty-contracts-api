// Vercel build + config injection.
//
// `vercel build` (Build Output API) assembles the function bundle by tracing
// imports from the entry point. `node-config-ts` loads `config/default.json`
// from disk at runtime (not via import), so the tracer never includes it and
// the function crashes with `config.imx is undefined` in production.
//
// `vercel.json`'s `functions.includeFiles` is ALSO ignored in Build Output API
// mode, so we inject the config into the prebuilt function bundle ourselves:
//   1. pnpm build        -> dist/ (+ dist/config via copy-config.mjs)
//   2. vercel build      -> .vercel/output/functions/api/index.func/
//   3. copy config/ + dist/config into that function bundle
//
// The function reads it via NODE_CONFIG_TS_DIR=dist/config (set in vercel.json).
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scope = process.env.VERCEL_SCOPE || 'niftyleague';
const isProd = process.argv.includes('--prod');

const run = (cmd) => {
  console.log(`[vercel-build] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
};

// 1. Compile sources (+ dist/config).
run('pnpm build');

// 2. Build the Vercel output.
// On Vercel's build server the project context is provided via env vars
// (VERCEL_PROJECT_ID / VERCEL_TOKEN), so `vercel build` needs NO --scope —
// passing one can conflict with that context and fail. Locally we `vercel pull`
// first (creates .vercel/project.json) so the unscoped build works too.
if (!existsSync(resolve(root, '.vercel', 'project.json'))) {
  run(`npx vercel pull --yes --scope ${scope}`);
}
run(`npx vercel build${isProd ? ' --prod' : ''}`);

// 3. Inject config into the function bundle.
const funcDir = resolve(root, '.vercel', 'output', 'functions', 'api', 'index.func');
if (!existsSync(funcDir)) {
  throw new Error(`Function bundle not found at ${funcDir}; build may have failed.`);
}

const targets = [
  resolve(funcDir, 'config'),
  resolve(funcDir, 'dist', 'config'),
];
for (const dest of targets) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(resolve(root, 'config'), dest, { recursive: true });
  console.log(`[vercel-build] injected config -> ${dest}`);
}

console.log('[vercel-build] done. Deploy with: npx vercel deploy --prebuilt --prod --scope ' + scope);
