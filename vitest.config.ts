import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.vercel/**', '**/coverage/**'],
    env: {
      VERCEL: '1',
    },
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      // Measure the production API/webhook runtime. Manual IMX onboarding,
      // one-off CLI commands, generated contracts/types, and deprecated
      // snapshot routes are validated by build/type-check rather than unit
      // coverage.
      include: [
        'src/index.ts',
        'src/classes/degen.ts',
        'src/classes/minty.ts',
        'src/utils/api.ts',
        'src/utils/assets.ts',
        'src/utils/degensBurned.ts',
        'src/utils/handleNameChange.ts',
        'src/utils/imageGenerator.ts',
        'src/utils/it-all.ts',
        'src/utils/nftl.ts',
        'src/utils/refreshMetadata.ts',
        'src/utils/uploadToS3.ts',
        'src/utils/uriHelpers.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/constants/**', 'src/contracts/**', 'src/types/**', 'src/imx/**'],
      thresholds: {
        branches: 25,
        functions: 25,
        lines: 25,
        statements: 25,
      },
    },
  },
});
