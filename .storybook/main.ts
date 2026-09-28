import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { createViteBase } from "../src/application/vite-base.ts";
import { STORYBOOK_STORY_GLOBS } from "../script/test-runner-config.ts";

const STORYBOOK_CHUNK_SIZE_WARNING_LIMIT = 1200;

const config: StorybookConfig = {
  stories: [...STORYBOOK_STORY_GLOBS],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/react-vite",
  viteFinal(viteConfig) {
    const base = createViteBase(false);
    return mergeConfig(viteConfig, {
      ...base,
      build: {
        ...base.build,
        chunkSizeWarningLimit: STORYBOOK_CHUNK_SIZE_WARNING_LIMIT,
      },
    });
  },
};

export default config;
