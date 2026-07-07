import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { NotificationToast } from "@/components/ui/NotificationToast";

// Inline loader keyframes — injected synchronously with index.css lifecycle,
// before any React render. This guarantees LoadingCircle's animation exists
// even during lazy-loaded Suspense fallback, before page CSS chunks arrive.
{
  const style = document.createElement("style");
  style.textContent =
    "@keyframes poprako-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
  document.head.appendChild(style);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <NotificationToast />
  </StrictMode>,
);

// Preload secondary routes after first paint so navigation feels instant.
// requestIdleCallback avoids competing with the initial render + hydrate work;
// fall back to a short setTimeout in environments that lack it.
const schedulePreload = (fn: () => void) => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(fn);
  } else {
    setTimeout(fn, 200);
  }
};

schedulePreload(() => {
  // fire-and-forget — failures are non-fatal (the lazy route Suspense
  // will retry on navigation)
  void import("@/pages/WorkspacePage");
  void import("@/pages/ComicPlaygroundPage");
});
