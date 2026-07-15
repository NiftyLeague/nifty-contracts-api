# Simple API for catching webhooks

## Getting Started

### Requirements

You need node `v24` (see `.nvmrc`). The API is hosted on [Vercel](https://vercel.com).

## Deploy (Vercel)

The Express app (`src/index.ts`, which imports `express` and `export default app`) is
auto-detected by Vercel's **Express** framework preset (`framework: "express"` in
`vercel.json`) and served as a single Vercel Serverless Function. No catch-all rewrite
or separate entry file is needed — Vercel wires routing to the app directly.

- **Production (mainnet):** the `main` branch deploys to the Production environment
  (`api.niftyleague.com`, `ETH_NETWORK=mainnet`).
- **Preview (sepolia / dev):** the dev branch deploys to a Preview environment
  (e.g. `api-dev.niftyleague.com`, `ETH_NETWORK=sepolia`).

1. Link the project: `vercel link` (or create it in the dashboard, framework preset "Express").
2. Set the environment variables from `.env.example`, scoped per environment
   (Production vs Preview) in the Vercel dashboard.
3. Deploy: `vercel --prod` for production, or push the branch for a preview.

`config/default.json` is bundled into the function at runtime via `includeFiles` in
`vercel.json`, so no build step is required for configuration.

## API Quick Start

Run `pnpm dev` to start up your local API on post 5005 in watchmode

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
