module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 uses React Compiler (reactCompiler: true in app.json).
    // The old Babel plugin is NOT compatible with Reanimated 4 + React Compiler
    // and causes "Exception in HostFunction" crashes. Keep plugins empty.
    plugins: [],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};