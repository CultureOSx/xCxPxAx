module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // other plugins can go here
      'react-native-reanimated/plugin', // MUST be last
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};