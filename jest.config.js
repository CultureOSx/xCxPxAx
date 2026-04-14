module.exports = {
  preset: 'jest-expo',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text-summary'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    // pipeline/queue — bullmq/ioredis live under pipeline/package.json only; stubs for Jest
    '^bullmq$': '<rootDir>/pipeline/queue/test-doubles/bullmq-stub.cjs',
    '^ioredis$': '<rootDir>/pipeline/queue/test-doubles/ioredis-stub.cjs',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};
