import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/route-tree.gen";
import { RoutePending } from "@/application/RoutePending";
import { applicationApi } from "@/application/api";

export function parseRouteSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const values: Record<string, string> = Object.create(null) as Record<string, string>;
  params.forEach((value, key) => {
    if (!Object.hasOwn(values, key)) {
      values[key] = value;
    }
  });
  return values;
}

export function stringifyRouteSearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "string") {
      throw new TypeError(`Route search value for ${key} must be a string`);
    }
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const router = createRouter({
  routeTree,
  context: { api: applicationApi },
  parseSearch: parseRouteSearch,
  stringifySearch: stringifyRouteSearch,
  defaultPreload: "intent",
  defaultPendingComponent: RoutePending,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
