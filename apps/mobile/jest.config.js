/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  rootDir: __dirname,
  roots: ["<rootDir>"],
  // Avoid slow Watchman recrawls on large monorepo trees (use CLI --watchman=true if you prefer).
  watchman: false,
  testMatch: ["<rootDir>/**/__tests__/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
