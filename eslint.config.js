import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'public/**',
      '.vercel/**',
      'dist/**',
      'scripts/**/*.mjs',
      '*.mjs',
      '*.config.js',
      '*.config.cjs',
      '.eslintrc.cjs',
      '.lintstagedrc.cjs',
      'api/types/typechain/**',
    ],
  },
);
