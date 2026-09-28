export const routeConfiguration = {
  target: "react" as const,
  routesDirectory: "./src/route",
  generatedRouteTree: "./src/route-tree.gen.ts",
  routeFileIgnorePattern: "^business$",
  autoCodeSplitting: true,
};
