export default {
  '*.{cjs,mjs,js,jsx,ts,tsx}': ['pnpm exec eslint --fix'],
  '*.{json,md,yaml,yml,css,scss,less,html}': ['pnpm exec prettier --write'],
};

