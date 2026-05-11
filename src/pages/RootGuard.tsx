import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingCircle from "@/components/ui/LoadingCircle";

export default function RootGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/workspace", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <LoadingCircle />
    </div>
  );
}
