/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  testPathIgnorePatterns: ['node_modules', 'dist'],
  coveragePathIgnorePatterns: ['node_modules', 'dist', 'src/constants', 'src/contracts', 'src/types'],
  // collectCoverage: true,
  testTimeout: 15000,
};
