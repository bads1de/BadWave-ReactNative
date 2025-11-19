// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  env: {
    jest: true,
  },
  globals: {
    setTimeout: true,
    clearTimeout: true,
  },
  plugins: [
    'unused-imports',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off', // unused-importsと競合するため無効化
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
  },
};
