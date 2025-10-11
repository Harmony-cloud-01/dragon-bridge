module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "jsx-a11y",
    "react",
    "react-hooks",
  ],
  extends: [
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:@next/next/recommended",
    "prettier",
  ],
  env: {
    browser: true,
    es2023: true,
    node: true,
  },
  ignorePatterns: [
    "*.js",
    "*.cjs",
    "*.mjs",
    "node_modules",
    ".next",
    "out",
  ],
  rules: {
    "react/jsx-props-no-spreading": "off",
    "react/require-default-props": "off",
    "react/no-unstable-nested-components": "off",
    "import/prefer-default-export": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  },
};

