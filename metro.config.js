const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicit resolution helper for Windows environments
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'lodash': path.resolve(__dirname, 'node_modules/lodash'),
};

module.exports = withNativeWind(config, {
  input: "./src/styles/global.css",
});
