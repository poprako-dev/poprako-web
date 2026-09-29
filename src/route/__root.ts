import { createRootRouteWithContext } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "@/route/business/RouteError";
import type { ApplicationContext } from "@/route/business/api-context";
import { ApplicationRoot } from "@/route/business/ApplicationRoot";

export const Route = createRootRouteWithContext<ApplicationContext>()({
  component: ApplicationRoot,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});
