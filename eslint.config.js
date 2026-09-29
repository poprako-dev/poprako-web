import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @param {Partial<import("eslint").Linter.RulesRecord>} rules */
function errorRules(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([name, value]) => [
      name,
      value === undefined || value === 0 || value === "off"
        ? "off"
        : Array.isArray(value)
          ? value[0] === 0 || value[0] === "off"
            ? value
            : ["error", ...value.slice(1)]
          : "error",
    ]),
  );
}

const configuration = tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "storybook-static/**",
      "test-resource/generated/**",
      "**/*.timestamp-*.mjs",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-alert": "error",
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-empty": "error",
      "array-callback-return": "error",
      "no-self-compare": "error",
      "no-implicit-coercion": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "@typescript-eslint/prefer-function-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
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
    plugins: { react },
    settings: { react: { version: "19.1" } },
    languageOptions: { globals: globals.browser },
    rules: {
      "react/jsx-key": "error",
      "react/button-has-type": "error",
      "react/jsx-no-target-blank": "error",
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["region", "tabpanel"] }],
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/incompatible-library": "error",
      "react-hooks/unsupported-syntax": "error",
    },
  },
  {
    files: ["*.config.{js,mjs,cjs,ts}", ".storybook/**/*.ts", "script/**/*.{ts,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["script/test-*-browser.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["script/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, Deno: "readonly" } },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/application/test/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.test.json",
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["script/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": ["error", { allow: ["error", "warn", "log"] }],
    },
  },
  {
    files: [
      ".storybook/**/*.ts",
      "src/**/*.stories.{ts,tsx}",
      "src/**/business/test/**/*.{ts,tsx}",
    ],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.storybook.json",
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...storybook.configs["flat/recommended"].map((entry) => ({
    ...entry,
    files: entry.files ?? ["**/*"],
    rules: entry.rules ?? {},
    plugins: entry.plugins ?? {},
  })),
  prettier,
);

export default configuration.map((entry) =>
  entry.rules ? { ...entry, rules: errorRules(entry.rules) } : entry,
);
