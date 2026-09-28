import { Outlet, useRouteContext } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { ApiProvider } from "./ApiProvider";

export function ApplicationRoot(): ReactElement {
  const { api } = useRouteContext({ from: "__root__" });
  return (
    <ApiProvider client={api}>
      <Outlet />
    </ApiProvider>
  );
}
