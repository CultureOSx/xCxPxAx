const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [{
          "name": "react-native",
          "importNames": ["Image"],
          "message": "Use Image from 'expo-image' instead for proper caching and performance."
        }]
      }]
    }
  }
]);
