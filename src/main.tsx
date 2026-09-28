import { StrictMode, useEffect, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/application/router";
import { NotificationToast } from "@/shared/component/notification-toast/NotificationToast";
import { useAppStore } from "@/route/business/session/session-store";
import { installConsoleLogCollector } from "@/shared/utility/console-log";
import "@/application/style.css";

export function Application(): ReactElement {
  useEffect(
    () =>
      useAppStore.subscribe((state, previous) => {
        if (state.generation !== previous.generation) {
          void router.invalidate();
        }
      }),
    [],
  );
  return <RouterProvider router={router} />;
}

const rootElement = document.querySelector("#root");
if (!rootElement) {
  throw new Error("Root element was not found");
}
installConsoleLogCollector();
const loaderStyle = document.createElement("style");
loaderStyle.textContent =
  "@keyframes poprako-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
document.head.append(loaderStyle);

createRoot(rootElement).render(
  <StrictMode>
    <Application />
    <NotificationToast />
  </StrictMode>,
);
