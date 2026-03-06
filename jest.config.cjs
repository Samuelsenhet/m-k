/** Jest config for Expo Router / React Native tests (jest-expo). */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*-test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/src/'],
};
