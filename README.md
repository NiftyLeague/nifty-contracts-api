# Simple API for catching webhooks

## Getting Started

### Requirements

You need node `v24` (see `.nvmrc`). The API is hosted on [Vercel](https://vercel.com).

## Deploy (Vercel)

The API is compiled to `dist/` by `pnpm build` (`tsc` + `tsc-alias` to rewrite the
`@/*` path aliases) and served by a thin serverless entry `api/index.js` that
re-exports `dist/src/index.js` (the default-exported Express app). `vercel.json`
uses a `buildCommand` + catch-all `rewrite` to `/api/index` rather than the
legacy `"framework": "express"` preset, which avoids the ESM/tsc-alias module
resolution crash the preset triggered.

- **Production (mainnet):** the `main` branch deploys to the Production environment
  (`api.niftyleague.com`, `ETH_NETWORK=mainnet`).
- **Preview (sepolia / dev):** the dev branch deploys to a Preview environment.

1. Link the project: `vercel link --scope niftyleague`.
2. Set the environment variables from `.env.example`, scoped per environment
   (Production vs Preview) in the Vercel dashboard. **Every `@@VAR` in
   `config/default.json` must be set** or the config resolves to `undefined` and
   handlers can crash.
3. Build and deploy with `pnpm deploy` (or the expanded form below). `pnpm deploy`
   runs `scripts/vercel-build.mjs`, which compiles `dist/`, builds the Vercel
   output, and injects `config/` + `dist/` into the function bundle, then deploys
   the prebuilt artifact:

   ```bash
   pnpm deploy
   # equivalent to:
   node scripts/vercel-build.mjs --prod && \
     npx vercel deploy --prebuilt --prod --scope niftyleague
   ```

`config/default.json` is loaded from disk at runtime by `node-config-ts` (via
`NODE_CONFIG_TS_DIR=dist/config`), so it cannot be traced by `vercel build` and
must be injected into the function bundle by `scripts/vercel-build.mjs`. Note that
`functions.includeFiles` in `vercel.json` is **ignored** by both the local CLI and
the server-side builder, so the script's manual injection is the only thing keeping
the config in the deployed bundle.

### Git auto-deploy is disabled

Pushing to `main` runs CI (the `test` job + the `live-audit` job, which runs
`pnpm audit:endpoints` against production), **but must NOT trigger a Vercel Git
production deploy**: the server-side `vercel build` step does not produce a usable
`.vercel/output` for this repo (it omits `dist/src/index.js` from the function
bundle), which 500s every route. **Disable the Git production deployment in the
Vercel dashboard** (Project → Git → "Production Git Branch" → unlink, or set
Deployments to "None" for pushes) and deploy exclusively via `pnpm deploy`.

### Vercel proxy notes

Vercel terminates TLS at the edge, so the raw `@vercel/node` `(req, res)` bridge
invokes the Express handler **without** `trust proxy`. `src/index.ts` sets
`app.set('trust proxy', true)` and builds the root `GET /` base URL from
`X-Forwarded-Proto`/`Host` (never `req.protocol`, which reads
`req.socket.encrypted` and throws on the edge). Do not reintroduce `req.protocol`.

## Local validation

```bash
pnpm install
pnpm type-check && pnpm lint && pnpm test   # hermetic, mocked, offline
pnpm test:live                              # hits BASE_URL (default prod) — needs network
node scripts/audit-endpoints.mjs            # contract gate an AI agent runs after a dep bump
```

`pnpm test` ignores `dist`, `.vercel`, and `coverage` so a local `vercel build`
cannot pollute the run.

## API contract → test mapping (for AI maintenance)

| Route                | Contract source                         | Hermetic unit test                            | Live test                         |
| -------------------- | --------------------------------------- | --------------------------------------------- | --------------------------------- |
| `GET /`              | `src/constants/api.ts`                  | `src/index.test.ts`                           | `test/smoke/api.contract.test.ts` |
| `/NFTL/supply*`      | `src/utils/nftl.ts`                     | `src/index.test.ts`, `src/utils/nftl.test.ts` | `test/smoke/...`                  |
| `/degens/burn-list`  | `src/utils/degensBurned.ts`             | `src/index.test.ts`                           | `test/smoke/...`                  |
| `/:network/degen/*`  | `src/utils/api.ts` (`pipeRequest`)      | `src/index.test.ts` (mocked)                  | `test/smoke/...`                  |
| `/imx/marketplace/*` | `src/constants/metadata/marketplace.ts` | `src/index.test.ts`                           | `test/smoke/...`                  |

When a dependency update breaks a route, the failure surfaces in the matching
hermetic test (fast) and, if it reaches production, in `pnpm audit:endpoints`
(non-zero exit). NFTL supply + burn-list resolvers are memoized for 60s
(`withCache` in `src/utils/api.ts`) and fall back to last-good on upstream
failure; `pipeRequest` has a 10s timeout and returns a 502 `{ errors: [...] }`
shape instead of hanging.

## Dependencies & known vulnerabilities

`pnpm-workspace.yaml` uses `overrides` to neutralize vulnerable transitive
dependencies. `axios` is forced to `^1.7.0` (the unmaintained `@imtbl/imx-sdk`
pins `axios@^0.21.1`, which carries the high/critical SSRF/DoS advisories); it
was verified that `ImmutableXClient` still constructs and the `src/imx/*` CLI
scripts type-check and run against axios 1.x.

Three **low**-severity advisories remain and are **not fixable** without
rewriting the IMX tooling — they live in `@imtbl/imx-sdk` → `magic-sdk` →
`web3-*` / `elliptic`, none of which publish a patched version:

- `elliptic <=6.6.1` (no `6.6.2` published)
- `web3-core-method` / `web3-core-subscriptions` (only prerelease `2.0.0-alpha.1` exists)

These affect only the offline `src/imx/*` onboarding/minting scripts, **not**
the live API routes, and are tracked in CI via `pnpm audit --audit-level high`.
To fully clear them, replace `@imtbl/imx-sdk` with direct calls to Immutable's
public REST API (out of scope for this pass).

## API Quick Start

Run `pnpm dev` to start up your local API on port 5005 in watch mode

## Commander Quick Start

To run commands locally:

1. Run `npm link` to add the `minty` command to your `$PATH`. This makes it easier to run Minty from anywhere on your computer.
2. Run a command such as `minty refresh-degen 1`

## IPFS Quick Start

> This command continues to run. All further commands must be entered in another terminal window.

> if there's no local ipfs repo at `$HOME/.ipfs`, initialize one:

```bash
npx go-ipfs init
```

> run local ipfs daemon

```bash
npx go-ipfs daemon
```

### Config & Env

This repo uses [node-config-ts](https://www.npmjs.com/package/node-config-ts) to handle environment variables.

You should always access .env variables via `/config/default.json`

_Example use:_

```JS
import { config } from 'node-config-ts';

const network = config.eth.network;
```

The TypeScript types for the config live in `config/Config.d.ts`. If you add or
change keys in `default.json`, update that declaration file to match (it augments
the `node-config-ts` `IConfig` interface).

---

## Environment Variables

Environment variables are managed in **Vercel** (source of truth). Sync them locally:

```bash
# Link this project to its Vercel project (one-time)
vercel link --scope niftyleague

# Pull all env vars into .env.local (gitignored)
vercel env pull .env.local
```

To push local changes back to Vercel:

```bash
vercel env push .env.local
# or set them per-environment (Production / Preview) in the Vercel dashboard
```

> Never commit `.env.local` — it is gitignored. For team projects use `vercel --scope niftyleague`.
