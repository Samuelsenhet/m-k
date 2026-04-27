const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Remove deprecated option that Metro no longer recognises (set by @expo/metro-config).
if (config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

// Keep Expo defaults (expo-doctor) and add monorepo root for workspace packages.
config.watchFolders = [
  ...new Set([...(config.watchFolders ?? []), monorepoRoot]),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Fix event-target-shim/index exports warning from react-native-webrtc.
// The package exports "." but not "./index"; rewrite the specifier so Metro
// resolves via the proper exports entry instead of falling back to file-based.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith("event-target-shim/index")) {
    return context.resolveRequest(
      context,
      moduleName.replace(/\/index$/, ""),
      platform,
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
