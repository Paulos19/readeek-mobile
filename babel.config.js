module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Se houver outros plugins, eles ficam aqui em cima...
      
      // MANTENHA APENAS ESTE (e sempre por último):
      "react-native-reanimated/plugin",
    ],
  };
};