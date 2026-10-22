import type { JSX } from "react";
import { useModuleResource } from "@/shared/hook/use-module-resource";
import { reloadPage } from "@/shared/utility/reload-page";
import type { ComicDetailModalProps } from "./ComicDetailModal";
import { ComicDetailLoadState } from "./ComicDetailLoadState";
import { comicDetailModule } from "./comic-detail-module";

type Props = Omit<ComicDetailModalProps, "comicInfo"> & {
  comicInfo: ComicDetailModalProps["comicInfo"] | null;
  isOpen: boolean;
  error: string | null;
  onRetry: () => void;
};

export function AsyncComicDetail({
  isOpen,
  error,
  onRetry,
  comicInfo,
  ...modalProps
}: Props): JSX.Element | null {
  const resource = useModuleResource(comicDetailModule, isOpen);
  if (!isOpen) return null;
  if (resource.status === "ready" && comicInfo) {
    const { ComicDetailModal } = resource.module;
    return <ComicDetailModal key={comicInfo.id} {...modalProps} comicInfo={comicInfo} />;
  }
  const moduleError = resource.status === "error" ? "加载漫画详情失败，请刷新页面" : null;
  function retry(): void {
    if (resource.status === "error") reloadPage();
    else if (error) onRetry();
  }
  return (
    <ComicDetailLoadState
      error={moduleError ?? error}
      retryLabel={moduleError ? "刷新页面" : "重新加载"}
      onRetry={retry}
      onClose={modalProps.onClose}
    />
  );
}
