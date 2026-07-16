// Traced import of the runtime config JSON.
//
// `node-config-ts` reads `config/default.json` from disk at runtime (fs, not
// import), so Vercel's bundler never includes it and the function crashes
// with `config.imx is undefined`. Importing the JSON here forces the bundler
// to trace `dist/config/default.json` into the deployed bundle, where
// `NODE_CONFIG_TS_DIR=dist/config` (vercel.json) points node-config-ts.
import configData from './config/default.json' with { type: 'json' };

export default configData;
