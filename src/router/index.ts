import { createElement, lazy, Suspense } from "react";
import LoadingEllipsis from "@/components/ui/LoadingEllipsis";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import WorkspacePage from "@/pages/WorkspacePage";
import ComicPlaygroundPage from "@/pages/ComicPlaygroundPage";
import MemberListPage from "@/pages/MemberListPage";
import LoginPage from "@/pages/LoginPage";
import RootGuard from "@/pages/RootGuard";

const errorElement = createElement(
  Suspense,
  { fallback: createElement(LoadingEllipsis) },
  createElement(lazy(() => import("@/pages/ErrorPage"))),
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: createElement(LoginPage),
    errorElement,
  },
  {
    path: "/",
    element: createElement(AppLayout),
    errorElement,
    children: [
      { index: true, element: createElement(RootGuard) },
      { path: "workspace", element: createElement(WorkspacePage) },
      {
        path: "comic-playground",
        element: createElement(ComicPlaygroundPage),
      },
      {
        path: "member-list",
        element: createElement(MemberListPage),
      },
    ],
  },
]);
