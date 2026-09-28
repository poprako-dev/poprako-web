import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/route-tree.gen";
import { parseRouteSearch, stringifyRouteSearch } from "@/application/router";

function createFixtureRouter(
  history: ReturnType<typeof createMemoryHistory>,
): ReturnType<typeof createRouter<typeof routeTree>> {
  return createRouter({
    routeTree,
    history,
    parseSearch: parseRouteSearch,
    stringifySearch: stringifyRouteSearch,
  });
}

export function createRouterFixture(initialUrl: string): {
  history: ReturnType<typeof createMemoryHistory>;
  router: ReturnType<typeof createFixtureRouter>;
} {
  const history = createMemoryHistory({ initialEntries: [initialUrl] });
  const router = createFixtureRouter(history);
  return { history, router };
}
