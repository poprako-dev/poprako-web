import { useCallback } from "react";
import { useRouter, type RegisteredRouter } from "@tanstack/react-router";

type RouteId = keyof RegisteredRouter["routesById"];

export function useRouteIntent(): (routeId: RouteId) => void {
  const router = useRouter();
  return useCallback(
    (routeId: RouteId): void => {
      void router.loadRouteChunk(router.routesById[routeId])?.catch((error: unknown) => {
        console.warn("[RouteIntent] 路由代码预热失败:", routeId, error);
      });
    },
    [router],
  );
}
