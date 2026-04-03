/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  rootDir: ".",
  // Avoid slow Watchman recrawls on large monorepo trees (use CLI --watchman=true if you prefer).
  watchman: false,
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
