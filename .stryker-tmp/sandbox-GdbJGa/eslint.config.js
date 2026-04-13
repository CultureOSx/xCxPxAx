// @ts-nocheck
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "node_modules/*", "ios/*", "android/*"],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [{
          "name": "react-native",
          "importNames": ["Image"],
          "message": "Use Image from 'expo-image' instead for proper caching and performance."
        }]
      }]
    }
  },
  prettier, // Must be last — disables ESLint rules that conflict with Prettier
]);
