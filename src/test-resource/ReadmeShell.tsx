import { useMemo, type ReactElement, type ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { AppSidebar } from "@/route/_authenticated/_shell/business/navigation/AppSidebar";
import { readmeSession } from "@/test-resource/readme-session";

type Props = {
  children: ReactNode;
  client: ApiClient;
  path: "/workspace" | "/comic-playground" | "/member-list" | "/utilities";
};

function ReadmeFrame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-page-paper">
      <AppSidebar />
      <main className="flex-1 min-h-0 w-full overflow-y-auto sm:pl-14 pb-14 sm:pb-0">
        {children}
      </main>
    </div>
  );
}

export function ReadmeShell({ children, client, path }: Props): ReactElement {
  const router = useMemo(() => {
    const root = createRootRoute();
    const page = createRoute({
      getParentRoute: () => root,
      path,
      component: () => <ReadmeFrame>{children}</ReadmeFrame>,
    });
    return createRouter({
      routeTree: root.addChildren([page]),
      history: createMemoryHistory({ initialEntries: [path] }),
    });
  }, [children, path]);
  return (
    <ApiProvider client={client}>
      <ReadySessionProvider value={readmeSession}>
        <RouterProvider router={router} />
      </ReadySessionProvider>
    </ApiProvider>
  );
}
