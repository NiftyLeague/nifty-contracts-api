## Stack

- **Service:** TypeScript API wrapping Nifty League smart contracts — serves on-chain read methods + token/collection metadata, plus Blocknative webhooks.
- **Runtime:** Bun `1.3.14` on Node `24.18.0`. Pinned via `mise.toml` (local + CI) and `.nvmrc`. CI uses `jdx/mise-action` to match.
- **Language:** TypeScript 5.9, `module: esnext`, `moduleResolution: bundler`, path alias `@/*` → `./src/*`.
- **HTTP:** Express 5 wrapped as a Vercel serverless function (`api/index.js` → `dist/src/index.js`).
- **Config:** `node-config-ts` reading `config/default.json` at runtime (post-build, copied to `api/.app/config/`). Type augmentation in `config/Config.d.ts`.
- **Tooling:** ESLint 9 (flat config), Prettier 3, `tsc`, `tsc-alias`, Husky + lint-staged.
- **Tests:** Bun native `bun test` — executed per-file through the in-repo harness `scripts/run-tests-isolated.ts` (Bun only; no vitest/jest — except Solidity in the sibling `nifty-smart-contracts` repo which is a separate workspace).
- **CLI:** `minty` bin at `commander.ts`.

## Commands

All script names below are literal `package.json` keys — run them as `bun run <name>`. The runner for `test` is **Bun native**, not vitest/jest.

| Task                 | Command                                   | What it runs                                                                                                                |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Install              | `bun install --frozen-lockfile`           | Pin via lockfile; triggers `postinstall` → `bun run build`                                                                  |
| Build                | `bun run build`                           | `node scripts/copy-config.mjs` → `npx tsc` → `tsc-alias` → `node scripts/copy-config.mjs` → `node scripts/copy-api-app.mjs` |
| Test                 | `bun run test`                            | `bun scripts/run-tests-isolated.ts` — isolated Bun test harness, **NOT** vitest                                             |
| Test watch           | `bun run test:watch`                      | `bun test --watch`                                                                                                          |
| Test coverage        | `bun run test:coverage`                   | `bun test --coverage --isolate`                                                                                             |
| Test live (network)  | `bun run test:live`                       | Hits `BASE_URL`; needs network — do not run in normal verify loop                                                           |
| Lint                 | `bun run lint`                            | `eslint .`                                                                                                                  |
| Type-check           | `bun run type-check` (alias `type:check`) | `tsc --noEmit`                                                                                                              |
| Format               | `bun run format`                          | `prettier --ignore-path .prettierignore --write .`                                                                          |
| Format check         | `bun run format:check`                    | `prettier --ignore-path .prettierignore --check .`                                                                          |
| Dev (watch)          | `bun dev`                                 | `tsx watch src/index.ts`, port 5005                                                                                         |
| Start (built)        | `bun start`                               | `node dist/src/index.js`                                                                                                    |
| Audit endpoints      | `bun run audit:endpoints`                 | Contract gate after a dep bump                                                                                              |
| Deploy (Vercel prod) | `bun run deploy`                          | `scripts/vercel-build.mjs --prod` + `vercel deploy --prebuilt --prod --scope niftyleague`                                   |
| IMX admin/onboarding | `bun run onboarding:*` / `admin:*`        | Offline CLI in `src/imx/` — not part of deployed surface                                                                    |

## Structure

```
src/
  index.ts                 # Express app + route mount; trust-proxy + buildBaseUrl
  index.test.ts            # Hermetic endpoint tests (supertest)
  index.webhook.test.ts    # Blocknative webhook handler tests
  classes/                 # Service classes (e.g. metadata resolvers)
  config/                  # Constants + metadata (marketplace, etc.)
  constants/               # API constants
  contracts/               # Contract ABIs + read method bindings (ethers v6)
  imx/                     # IMX onboarding/admin CLIs (offline only)
  types/                   # Shared TS types
  utils/                   # api.ts (pipeRequest, withCache), nftl.ts, degensBurned.ts
scripts/
  copy-config.mjs          # Copies config/default.json into api/.app/config/ (runs TWICE in build)
  copy-api-app.mjs         # Stages dist/ into api/ for the Vercel function bundle
  run-tests-isolated.ts    # Per-file bun test harness — required, do not call raw `bun test`
  audit-endpoints.mjs      # Contract audit gate
  vercel-build.mjs         # Manual function bundle injection (vercel.json includeFiles is ignored)
config/
  default.json             # Runtime config; every @@VAR must exist in Vercel env
  Config.d.ts              # Augments node-config-ts IConfig
api/                       # Vercel function entry (staging output of build)
test/                      # Live (network) smoke tests
commander.ts               # minty CLI entry
tsconfig.json              # ESM, bundler resolution, @/* alias
tsconfig.eslint.json       # ESLint type-aware include set
eslint.config.js           # Flat config
.prettierignore            # Excludes dist/, build outputs
bunfig.toml                # Excludes dist/, node_modules/, coverage/ from test discovery
mise.toml                  # node 24.18.0 + bun 1.3.14 (CI matches via jdx/mise-action)
```

## Conventions & Gotchas

- **Bun-only tooling.** `packageManager: bun@1.3.14`, toolchain pinned in `mise.toml` (node `24.18.0` + bun `1.3.14`), CI uses `jdx/mise-action`. Do not introduce pnpm/npm/yarn workflows; legacy `pnpm` mentions in README are stale. One root project — no workspaces.
- **Husky + lint-staged are active. Never `--no-verify`.** If the staged hook fails on `pnpm`-based commands in `.lintstagedrc.cjs`, either install pnpm globally or migrate the cjs to `bunx` — known half-finished migration.
- **Test runner is Bun native, executed via the in-repo harness.** Always `bun run test` (which runs `scripts/run-tests-isolated.ts` — each `*.test.ts` in its own `bun` process). Raw `bun test` is unsafe on bun 1.3.14: `mock.module` state leaks across files in one process (~27 false failures), and `bun test --isolate` hangs at summary. The per-file harness avoids both. Not vitest, not jest — Solidity lives in the sibling repo.
- **Build script order is load-bearing.** `copy-config.mjs` must run **before** `tsc` (so types resolve against the staged config) and **again after** `tsc-alias` (so the final bundle has config). `tsc-alias` must run **after** `tsc` (it rewrites the `@/*` alias to relative `.js` paths for Node's ESM loader). Do not bypass or reorder. `copy-api-app.mjs` runs last to stage `dist/` into `api/` for the Vercel bundle.
- **`@imtbl/imx-sdk` is not used** — deps are `ethers` v6 + `starknet` + `axios`. The README/old docs sometimes mention the IMX SDK; that is stale. Do not add it.
- **Vercel deploy is `bun run deploy` only.** Git auto-deploy to production is disabled in the dashboard because the server-side `vercel build` step omits `dist/src/index.js` from the function bundle and 500s every route. `vercel.json`'s `functions.includeFiles` is ignored — `scripts/vercel-build.mjs` manually injects `config/` + `dist/`. Every `@@VAR` in `config/default.json` must be set in the Vercel env or handlers crash on `undefined`.
- **Express 5 on Vercel edge:** `src/index.ts` sets `app.set('trust proxy', true)` because `@vercel/node` invokes the handler with a raw `(req, res)` bridge where `req.socket` is undefined. **Never reintroduce `req.protocol`** — it reads `req.socket.encrypted` and throws on every edge request. Build base URLs from `X-Forwarded-Proto` / `Host` (see `buildBaseUrl`).
- **Webhook secret is a URL segment, not a header.** `/:network/webhooks/degen/${config.blocknative.webhookSecret}` — Blocknative's signature scheme expects it. Do not move it to a header.
- **`pipeRequest` (`src/utils/api.ts`) has a 10s timeout** and returns `502 { errors: [...] }` on upstream failure. Never let it hang. NFTL supply + burn-list resolvers are memoized for 60s via `withCache` and **fall back to last-good on upstream failure** — do not break the last-good fallback.
- **`config/Config.d.ts` must be kept in sync** with `config/default.json` keys (it augments `node-config-ts`'s `IConfig`).
- **IMX scripts under `src/imx/onboarding/*` and `src/imx/admin/*` are offline-only CLI tools**, not part of the deployed API surface.
- **After any dep bump:** run `bun run audit:endpoints` to catch contract regressions, and verify the three known low-severity advisories (`elliptic`, `web3-core-method`, `web3-core-subscriptions`) have not been joined by new SSRF/DoS issues.
- **Deprecated route blocks in `src/index.ts` are commented out, not deleted** — leave them in place as historical context unless explicitly asked to remove.
