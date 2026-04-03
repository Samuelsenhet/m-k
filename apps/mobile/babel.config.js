const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "babel-plugin-module-resolver",
        {
          // Keep project root as resolution root. `@/assets` must be listed before `@` so imports
          // like `@/assets/icon.png` resolve to ./assets (not ./src/assets). Matches tsconfig paths.
          root: [path.resolve(__dirname)],
          alias: {
            "@/assets": path.resolve(__dirname, "assets"),
            "@": path.resolve(__dirname, "src"),
          },
          extensions: [
            ".ios.js",
            ".android.js",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
          ],
        },
      ],
    ],
  };
};
