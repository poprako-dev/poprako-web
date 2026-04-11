import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyUser } from "@/api/user";
import LoadingEllipsis from "@/components/ui/LoadingEllipsis";

export default function RootGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    getMyUser()
      .then(() => navigate("/comic-playground", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <LoadingEllipsis />
    </div>
  );
}
