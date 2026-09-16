import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// Portable stories and project annotations:
// https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
