module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-mmkv|react-native-track-player|react-native-fs)'
  ],
  setupFiles: [
    './jest.setup.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/android/**',
    '!**/ios/**',
    '!**/web-build/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/babel.config.js',
    '!**/metro.config.js'
  ]
};
