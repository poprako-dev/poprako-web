import "vitest/browser";

declare module "vitest/browser" {
  interface BrowserCommands {
    resetPointer: () => Promise<void>;
  }
}
