import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from "vite";

const STORYBOOK_CHUNK_SIZE_WARNING_LIMIT = 1200;

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite",
  viteFinal(viteConfig) {
    // The development inspector still calls ReactDOM.render, removed in React 19.
    viteConfig.plugins = viteConfig.plugins?.filter((plugin) =>
      !plugin || typeof plugin !== "object" || !("name" in plugin)
      || plugin.name !== "vite-plugin-react-inspector",
    );
    return mergeConfig(viteConfig, {
      build: {
        chunkSizeWarningLimit: STORYBOOK_CHUNK_SIZE_WARNING_LIMIT,
      },
    });
  },
};
export default config;
