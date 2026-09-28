import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/translator")({
  component: () => (
    <div className="h-dvh w-full">
      <Outlet />
    </div>
  ),
});
