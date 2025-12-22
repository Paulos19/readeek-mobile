// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // O plugin do reanimated DEVE ser o último da lista
      "react-native-reanimated/plugin",
    ],
  };
};