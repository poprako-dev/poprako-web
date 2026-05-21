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
