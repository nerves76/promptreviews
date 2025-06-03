// ESLint flat config for v9+
import next from "eslint-config-next";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...next(),
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
