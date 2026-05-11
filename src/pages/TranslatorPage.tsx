import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import WebTranslator from "@/features/WebTranslator";
import { useAppStore } from "@/store/app";
import { getMyUser } from "@/api/user";
import { listMyMembers } from "@/api/member";
import LoadingCircle from "@/components/ui/LoadingCircle";

export default function TranslatorPage() {
  const { chapterId, pageId } = useParams<{
    chapterId: string;
    pageId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginState = useAppStore((s) => s.loginState);
  const setLoginState = useAppStore((s) => s.setLoginState);
  const [isAuthReady, setIsAuthReady] = useState(loginState !== null);
  const returnTo = searchParams.get("returnTo");
  const returnComicId = searchParams.get("comicId");
  const returnChapterId = searchParams.get("chapterId");

  const handleExit = () => {
    if (
      (returnTo === "/workspace" || returnTo === "/comic-playground") &&
      returnComicId &&
      returnChapterId
    ) {
      const nextSearchParams = new URLSearchParams({
        comicId: returnComicId,
        chapterId: returnChapterId,
      });

      navigate({
        pathname: returnTo,
        search: `?${nextSearchParams.toString()}`,
      });
      return;
    }

    navigate(-1);
  };

  // Ensure user is authenticated before rendering translator
  useEffect(() => {
    if (loginState !== null) {
      setIsAuthReady(true);
      return;
    }

    Promise.all([getMyUser(), listMyMembers()])
      .then(([userInfo, memberInfos]) => {
        setLoginState({ userInfo, memberInfos });
        setIsAuthReady(true);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [loginState, navigate, setLoginState]);

  if (!isAuthReady) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <LoadingCircle />
      </div>
    );
  }

  if (!chapterId) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <p className="text-sm text-destructive">缺少章节 ID</p>
      </div>
    );
  }

  if (!pageId) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <p className="text-sm text-destructive">缺少页面 ID</p>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full">
      <WebTranslator
        chapterId={chapterId}
        startPageId={pageId}
        onExit={handleExit}
      />
    </div>
  );
}
