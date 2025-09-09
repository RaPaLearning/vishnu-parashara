import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JS/JSX files: JS and React rules
  {
    files: ["**/*.{js,jsx}"],
    plugins: { js, react: pluginReact },
    extends: ["js/recommended", pluginReact.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/react-in-jsx-scope": "off"
    }
  },
  // Test files: Jest env
  {
    files: ["**/*.test.js", "**/*.test.jsx"],
    languageOptions: {
      globals: { ...globals.browser, jest: true, describe: true, it: true, expect: true }
    }
  },
  // JSON files: JSON rules only
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"]
  },
  // CSS files: CSS rules only
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      "css/use-baseline": "off"
    }
  },
]);
