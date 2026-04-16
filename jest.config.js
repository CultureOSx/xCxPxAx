module.exports = {
  preset: 'jest-expo',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text-summary'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  /** Local agent worktrees live under .gitignored `.claude/`; skip so Jest does not scan duplicate package trees. */
  testPathIgnorePatterns: ['/node_modules/', '\\.claude\\/'],
};
