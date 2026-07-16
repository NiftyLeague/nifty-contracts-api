// Vercel serverless entry point.
//
// This is intentionally a plain .js file that imports the pre-built
// application from `dist/`. The build command (`pnpm build`) compiles the
// TypeScript sources with `tsc` + `tsc-alias`, which rewrites the `@/*` path
// aliases to relative paths and appends the `.js` extensions that Node's ESM
// loader requires. Importing the compiled output here avoids having the
// @vercel/node builder recompile raw TypeScript (which does not run tsc-alias
// and therefore produces extensionless/aliased imports that crash at runtime
// with ERR_MODULE_NOT_FOUND).
//
// node-config-ts loads JSON from disk. Set the bundle-relative config path
// before importing the app so Preview and Production need no dashboard env var.
globalThis.process.env.NODE_CONFIG_TS_DIR ??= 'dist/src/config';

const { default: app } = await import('../dist/src/index.js');

export default app;
