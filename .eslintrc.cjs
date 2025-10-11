module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'jsx-a11y', 'react', 'react-hooks'],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@next/next/recommended',
    'prettier',
  ],
  env: {
    browser: true,
    es2023: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  ignorePatterns: ['*.js', '*.cjs', '*.mjs', 'node_modules', '.next', 'out'],
  rules: {
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'react/no-unstable-nested-components': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  },
  overrides: [
    {
      files: ['*.config.{js,cjs,mjs,ts}', '*.config.*.ts', 'scripts/**/*.{js,ts,mjs}', '.husky/*'],
      env: {
        node: true,
      },
    },
  ],
}
