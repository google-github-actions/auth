module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  // We have many situations where we accept and expect arbitrary JSON payloads.
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
