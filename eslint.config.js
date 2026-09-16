import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "coverage", "node_modules", "storybook-static"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      unicorn.configs["flat/recommended"],
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            ".storybook/*.ts",
            "vitest.*.ts",
          ],
          defaultProject: "tsconfig.node.json",
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
    rules: {
      "max-len": ["error", { code: 100, tabWidth: 2 }],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-alert": "error",
      "no-console": "error",
      "no-implicit-coercion": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "unicorn/filename-case": "off",
      "unicorn/name-replacements": "off",
      "unicorn/no-null": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      eslintReact.configs["strict-type-checked"],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.strict,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/incompatible-library": "error",
      "react-hooks/unsupported-syntax": "error",
    },
  },
  {
    files: ["*.config.{js,mjs,cjs,ts}", "vite.config.ts", ".storybook/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
]);
