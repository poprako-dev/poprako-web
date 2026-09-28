import type { Preview } from "@storybook/react-vite";
import { createElement } from "react";
import { ThemeProvider } from "../src/application/ThemeProvider.tsx";
import "../src/application/style.css";

const preview: Preview = {
  decorators: [(Story) => createElement(ThemeProvider, null, createElement(Story))],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "error",
    },
  },
};

export default preview;
