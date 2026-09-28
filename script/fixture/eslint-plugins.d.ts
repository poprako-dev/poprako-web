// The pinned plugin publishes no declarations; describe only the configuration surface we consume.
declare module "eslint-plugin-jsx-a11y" {
  import type { Linter } from "eslint";
  const plugin: { flatConfigs: { strict: Linter.Config } };
  export default plugin;
}
