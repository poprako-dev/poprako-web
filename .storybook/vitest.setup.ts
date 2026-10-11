import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./preview";
import { checkStoryAccessibility } from "./accessibility";
import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

// Browser pages retain the pointer between stories, including CSS hover state.
beforeEach(async () => {
  await commands.resetPointer();
});

// This is an important step to apply the right configuration when testing your stories.
// Portable stories and project annotations:
// https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest
setProjectAnnotations([
  { ...a11yAddonAnnotations, afterEach: checkStoryAccessibility },
  projectAnnotations,
]);
