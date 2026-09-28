import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "@/routes/business/RouteError";

export const Route = createRootRoute({
  component: Outlet,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});
