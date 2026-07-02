// Metro: .html dosyalarini asset olarak paketle (oyun tek dosyalik HTML).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("html");

module.exports = config;
