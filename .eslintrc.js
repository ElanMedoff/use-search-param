// @ts-check

/** @type { import("eslint").Linter.Config } */
const config = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["**/.eslintrc.js", "**/tsup.config.ts", "**/jest.config.js"],
  rules: {
    "@typescript-eslint/unbound-method": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

module.exports = config;
