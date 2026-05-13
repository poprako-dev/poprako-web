import { createElement, lazy, Suspense, type ComponentType } from "react";
import LoadingCircle from "@/components/ui/LoadingCircle";
import { createBrowserRouter } from "react-router-dom";
import RootGuard from "@/pages/RootGuard";

function lazyElement(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);

  return createElement(
    Suspense,
    { fallback: createElement(LoadingCircle) },
    createElement(Component),
  );
}

const errorElement = lazyElement(() => import("@/pages/ErrorPage"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: lazyElement(() => import("@/pages/LoginPage")),
    errorElement,
  },
  {
    path: "/translator/:chapterId/:pageId",
    element: lazyElement(() => import("@/pages/TranslatorPage")),
    errorElement,
  },
  {
    path: "/",
    element: lazyElement(() => import("@/layouts/AppLayout")),
    errorElement,
    children: [
      { index: true, element: createElement(RootGuard) },
      {
        path: "workspace",
        element: lazyElement(() => import("@/pages/WorkspacePage")),
      },
      {
        path: "comic-playground",
        element: lazyElement(() => import("@/pages/ComicPlaygroundPage")),
      },
      {
        path: "member-list",
        element: lazyElement(() => import("@/pages/MemberGlancePage")),
      },
      {
        path: "system-mail",
        element: lazyElement(() => import("@/pages/SystemMailPage")),
      },
      {
        path: "settings",
        element: lazyElement(() => import("@/pages/SettingsPage")),
      },
    ],
  },
]);
