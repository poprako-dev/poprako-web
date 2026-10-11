import type { JSX } from "react";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type {
  ComicDetailSearch,
  WorkbenchDestination,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { ComicDetailLoadState } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailLoadState";
import { ComicDetailModal } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import { WorkspaceLayout } from "./WorkspaceLayout";
import { WorkspacePanel } from "./WorkspacePanel";
import { useWorkspaceController } from "./use-workspace-controller";

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
};

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export function Workspace({ search, onChangeSearch, onNavigateToWorkbench }: Props): JSX.Element {
  const workspace = useWorkspaceController({ search, onChangeSearch, onNavigateToWorkbench });
  return (
    <>
      <WorkspaceLayout>
        <WorkspacePanel
          username={workspace.username}
          selectedTeamId={workspace.selectedTeamId}
          team={workspace.team}
          isAdmin={workspace.isAdmin}
          onlineCount={workspace.onlineCount}
          onlineUsers={workspace.onlineUsers}
          onlineStatus={workspace.onlineStatus}
          comments={workspace.comments}
          commentsLoading={workspace.commentsLoading}
          onSendComment={workspace.handleSendComment}
          mobileTab={workspace.mobileTab}
          onChangeMobileTab={workspace.setMobileTab}
          onTouchStart={workspace.handleTouchStart}
          onTouchEnd={workspace.handleTouchEnd}
          comicListRefreshKey={workspace.comicListRefreshKey}
          onComicClick={workspace.openComicDetail}
        />
      </WorkspaceLayout>
      {workspace.isDetailOpen && !workspace.selectedComic && (
        <ComicDetailLoadState
          error={workspace.detailError}
          onRetry={workspace.retryComicDetail}
          onClose={workspace.clearComicDetail}
        />
      )}
      {workspace.selectedComic && (
        <ComicDetailModal
          key={workspace.selectedComic.id}
          comicInfo={workspace.selectedComic}
          pinnedChapter={workspace.selectedComicPinnedChapter}
          mode={workspace.detailMode}
          onModeChange={workspace.changeDetailMode}
          initialChapterId={workspace.urlChapterId}
          onNavigateToWorkbench={workspace.navigateToWorkbench}
          onChanged={workspace.handleDetailChanged}
          onClose={workspace.clearComicDetail}
        />
      )}
    </>
  );
}
