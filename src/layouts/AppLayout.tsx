import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/features/AppSidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <AppSidebar />
      <main className="flex-1 ml-14">
        <Outlet />
      </main>
    </div>
  );
}
