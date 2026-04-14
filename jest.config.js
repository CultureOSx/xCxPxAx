module.exports = {
  preset: 'jest-expo',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text-summary'],
  testPathIgnorePatterns: ['/node_modules/', '^<rootDir>/.claude/', '^<rootDir>/.stryker-tmp/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.stryker-tmp/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};
