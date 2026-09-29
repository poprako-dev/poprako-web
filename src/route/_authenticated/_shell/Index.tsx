import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/")({
  beforeLoad: () => {
    // TanStack redirects are control-flow values consumed by the router.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/workspace", search: {}, replace: true });
  },
});
