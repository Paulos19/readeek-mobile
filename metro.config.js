// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Adicionamos suporte ao NativeWind apontando para o nosso CSS global
// 2. O NativeWind v4 transforma esse CSS em estilos nativos para o app
module.exports = withNativeWind(config, { input: "./global.css" });