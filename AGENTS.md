# AGENTS.md — nifty-contracts-api

> Operating instructions for AI agents working in this repo.
> Repo reality: serverless **Express 5** API deployed to **Vercel**, written in **TypeScript**, package manager **bun** (1.3.14). Not Next.js, not a monorepo.

## Stack

- **Runtime:** Node `24.18.0` (pinned via `.nvmrc` and `mise.toml`), bun `1.3.14`
- **Language:** TypeScript 5.9, `module: esnext`, `moduleResolution: bundler`
- **Framework:** Express 5 wrapped as a Vercel serverless function (`api/index.js` → `dist/src/index.js`)
- **Config:** `node-config-ts` + `config/default.json` (loaded at runtime from `api/.app/config/`)
- **Tooling:** ESLint 9 (flat config), Prettier 3, tsc, tsc-alias, Husky + lint-staged
- **Test runner:** `bun test` (run per-file via `scripts/run-tests-isolated.ts`)
- **Bin:** `minty` CLI at `commander.ts`

## Commands (all via bun)

From `package.json`. Use these — do not invent your own.

| Task                 | Command                              | Notes                                                 |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| Install              | `bun install`                        | Runs `postinstall` → `bun run build` automatically    |
| Dev (watch)          | `bun dev`                            | `tsx watch src/index.ts`, port 5005                   |
| Build                | `bun run build`                      | `copy-config` → `tsc` → `tsc-alias` → `copy-config` → `copy-api-app` |
| Start (built)        | `bun start`                          | `node dist/src/index.js`                              |
| Lint                 | `bun run lint`                       | `eslint .`                                            |
| Format               | `bun run format` / `format:check`    | Prettier                                              |
| Typecheck            | `bun run type-check` (alias `type:check`) | `tsc --noEmit`                                  |
| Test (hermetic)      | `bun test`                           | Wraps `scripts/run-tests-isolated.ts` — see "Tests"   |
| Test watch           | `bun run test:watch`                 | `bun test --watch`                                    |
| Test coverage        | `bun run test:coverage`              | `bun test --coverage --isolate`                       |
| Test live (network)  | `bun run test:live`                  | Hits `BASE_URL` (default prod) — needs network        |
| Audit endpoints      | `bun run audit:endpoints`            | Contract gate an AI agent runs after a dep bump       |
| Deploy (Vercel prod) | `bun run deploy`                     | `scripts/vercel-build.mjs --prod` + `vercel deploy --prebuilt --prod --scope niftyleague` |
| IMX onboarding/admin | `bun run onboarding:*` / `admin:*`   | Offline CLI scripts in `src/imx/`                     |

## Conventions

- **Husky + lint-staged** are active. Do not bypass with `--no-verify`. Note: the husky `pre-commit` hook adds `bun` to `PATH` and invokes `bun lint-staged`, but `.lintstagedrc.cjs` still references `pnpm` for `tsc`/`eslint`/`prettier`. If `pnpm` is not on PATH, staged hooks will fail — either install pnpm globally or migrate the cjs to `bunx`. This is a known half-finished migration.
- **One root project, no workspaces.** Don't try to add `pnpm-workspace.yaml` or `bun-workspaces` semantics; the `pnpm` references in `README.md` are legacy documentation, not active config.
- **Express 5 on Vercel edge:** `src/index.ts:27` sets `app.set('trust proxy', true)` because `@vercel/node` invokes the handler with a raw `(req, res)` bridge where `req.socket` is undefined. **Never reintroduce `req.protocol`** — it reads `req.socket.encrypted` and throws on every edge request. Build base URLs from `X-Forwarded-Proto` / `Host` (see `buildBaseUrl` in `src/index.ts:29`).
- **Vercel deploy is `bun run deploy` only.** Git auto-deploy to production is **disabled in the Vercel dashboard** because the server-side `vercel build` step omits `dist/src/index.js` from the function bundle and 500s every route. CI runs tests + `audit:endpoints` on push; deployment is a separate manual step.
- **Runtime config (`config/default.json`)** is loaded at runtime by `node-config-ts` and cannot be traced by `vercel build`. `scripts/vercel-build.mjs` manually injects `config/` + `dist/` into the function bundle; `vercel.json`'s `functions.includeFiles` is **ignored**, so the script's manual injection is the only thing keeping config in the deployed bundle. Every `@@VAR` in `config/default.json` must be set in the Vercel environment or handlers will crash on `undefined`.
- **TypeScript types for config** live in `config/Config.d.ts`. When adding/changing keys in `default.json`, update `Config.d.ts` to match — it augments the `node-config-ts` `IConfig` interface.
- **Path aliases:** `@/*` → `./src/*`. The `tsc-alias` step in the build rewrites these to relative paths with `.js` extensions for Node's ESM loader. Do not import `dist/` outputs without the alias being resolved.

## Tests

- **Always run `bun test` (not raw `bun test`) when verifying changes.** It invokes `scripts/run-tests-isolated.ts`, which runs each `*.test.ts` file in its own `bun` process. This is required because bun 1.3.14 leaks `mock.module` state across files in a single process (causes ~27 false failures), and `bun test --isolate` hangs at summary. Per-file processes avoid both.
- `bunfig.toml` excludes `dist/**`, `node_modules/**`, `coverage/**` from the test run.
- `bun run test:live` hits the real `BASE_URL` and needs network — do not run it as part of a normal verification loop; reserve it for contract audits.
- **Endpoint contract → test mapping** (run `bun run audit:endpoints` after a dep bump to catch regressions):

  | Route                | Contract source                         | Hermetic test                            | Live test                         |
  | -------------------- | --------------------------------------- | ---------------------------------------- | --------------------------------- |
  | `GET /`              | `src/constants/api.ts`                  | `src/index.test.ts`                      | `test/smoke/api.contract.test.ts` |
  | `/NFTL/supply*`      | `src/utils/nftl.ts`                     | `src/index.test.ts`, `src/utils/nftl.test.ts` | `test/smoke/...`              |
  | `/degens/burn-list`  | `src/utils/degensBurned.ts`             | `src/index.test.ts`                      | `test/smoke/...`                  |
  | `/:network/degen/*`  | `src/utils/api.ts` (`pipeRequest`)      | `src/index.test.ts` (mocked)             | `test/smoke/...`                  |
  | `/imx/marketplace/*` | `src/constants/metadata/marketplace.ts` | `src/index.test.ts`                      | `test/smoke/...`                  |

## Runtime behavior to preserve

- `pipeRequest` (`src/utils/api.ts`) has a **10s timeout** and returns a `502 { errors: [...] }` shape on upstream failure — never hang.
- NFTL supply resolvers and the burn-list resolver are memoized for **60s** via `withCache` in `src/utils/api.ts` and **fall back to last-good on upstream failure**. Do not break the last-good fallback.
- Webhook handler at `src/index.ts:296` matches `/:network/webhooks/degen/${config.blocknative.webhookSecret}` — the secret is the URL segment, not a header. Keep it that way; Blocknative's signature scheme expects it.

## Things to watch for

- **`@imtbl/imx-sdk` pin pulls vulnerable `axios@^0.21.1`.** `package.json` does not yet use an `overrides` block to force axios 1.x (the README claims it does — stale). After any dep bump, run `bun run audit:endpoints` and `pnpm audit --audit-level high` to confirm the three low-severity advisories (`elliptic`, `web3-core-method`, `web3-core-subscriptions`) are still the only ones and that no SSRF/DoS advisories have re-entered via the SDK.
- The CLI scripts under `src/imx/onboarding/*` and `src/imx/admin/*` are **offline-only**; they are not part of the deployed API surface.
- Deprecated route blocks in `src/index.ts` are commented out, not deleted — leave them in place as historical context unless explicitly asked to remove.
