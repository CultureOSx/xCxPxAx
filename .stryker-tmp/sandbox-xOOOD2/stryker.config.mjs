// @ts-nocheck
// 
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  _comment:
    "This config was generated using 'stryker init'. Please see the guide for more information: https://stryker-mutator.io/docs/stryker-js/guides/react",
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'off',
  mutate: [
    'hooks/useRole.ts',
    'hooks/useCouncil.ts',
    'contexts/OnboardingContext.tsx',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/__tests__/**',
  ],
  thresholds: {
    high: 80,
    low: 65,
    break: 60,
  },
  timeoutMS: 15000,
  timeoutFactor: 1.5,
  ignorePatterns: [
    '.stryker-tmp/**',
    '.claude/**',
    'ios/**',
    'android/**',
    'functions/**',
    'server/**',
    '.expo/**',
    '.next/**',
    'dist/**',
  ],
  mutator: {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  },
  plugins: [
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker',
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  checkers: ['typescript'],
};
export default config;
