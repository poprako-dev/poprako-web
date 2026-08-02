import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { useTeamOnlineLease } from "@/hooks/useTeamOnline";

export default function App() {
  useTeamOnlineLease();

  return <RouterProvider router={router} />;
}
