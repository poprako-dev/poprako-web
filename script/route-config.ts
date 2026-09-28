export const routeConfiguration = {
  target: "react" as const,
  routesDirectory: "./src/routes",
  generatedRouteTree: "./src/route-tree.gen.ts",
  routeFileIgnorePattern: "^business$",
  autoCodeSplitting: true,
};
