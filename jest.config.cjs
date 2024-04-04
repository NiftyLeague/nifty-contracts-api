/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/api/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  testPathIgnorePatterns: ['node_modules', 'dist'],
  coveragePathIgnorePatterns: ['node_modules', 'dist', 'api/constants', 'api/contracts', 'api/types'],
  // collectCoverage: true,
  testTimeout: 10000,
};
