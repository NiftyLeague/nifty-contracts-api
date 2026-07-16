// Set the runtime config directory before the compiled application evaluates.
// This module is imported before the static app export in index.js.
globalThis.process.env.NODE_CONFIG_TS_DIR ??= 'dist/src/config';
