import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { RouteError, RouteNotFound } from "@/route/business/RouteError";
import type { ApplicationContext } from "@/route/business/api-context";
import { ApiProvider } from "@/route/business/ApiProvider";

export const Route = createRootRouteWithContext<ApplicationContext>()({
  component: ApplicationRoot,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function ApplicationRoot(): ReactElement {
  const { api } = Route.useRouteContext();
  return (
    <ApiProvider client={api}>
      <Outlet />
    </ApiProvider>
  );
}
