import { RouterProvider } from "react-router-dom";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { router } from "@/router";

export default function App() {
  return (
    <>
      <NotificationToast />
      <RouterProvider router={router} />
    </>
  );
}
