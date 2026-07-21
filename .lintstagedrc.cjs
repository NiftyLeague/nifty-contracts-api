module.exports = {
  // Type check TypeScript files
  '**/*.ts': () => 'bun run type-check',

  // Lint then format TypeScript and JavaScript files
  '**/*.(ts|js)': filenames => [
    `bunx eslint --fix ${filenames.join(' ')}`,
    `bunx prettier --write ${filenames.join(' ')}`,
  ],

  // Format MarkDown and JSON
  '**/*.(md|json)': filenames => `bunx prettier --write ${filenames.join(' ')}`,
};
