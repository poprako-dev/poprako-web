import type { JSX } from "react";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type {
  ComicDetailSearch,
  WorkbenchDestination,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { AsyncComicDetail } from "@/route/_authenticated/_shell/business/comic-detail/AsyncComicDetail";
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
  onWorkbenchIntent?: ((mode: ComicDetailMode) => void) | undefined;
};

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export function Workspace({
  search,
  onChangeSearch,
  onNavigateToWorkbench,
  onWorkbenchIntent,
}: Props): JSX.Element {
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
          onlineCountStatus={workspace.onlineCountStatus}
          onOnlineOpenChange={workspace.onOnlineOpenChange}
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
      <AsyncComicDetail
        isOpen={workspace.isDetailOpen}
        error={workspace.detailError}
        onRetry={workspace.retryComicDetail}
        comicInfo={workspace.selectedComic}
        pinnedChapter={workspace.selectedComicPinnedChapter}
        mode={workspace.detailMode}
        onModeChange={workspace.changeDetailMode}
        initialChapterId={workspace.urlChapterId}
        onNavigateToWorkbench={workspace.navigateToWorkbench}
        onWorkbenchIntent={onWorkbenchIntent}
        onChanged={workspace.handleDetailChanged}
        onClose={workspace.clearComicDetail}
      />
    </>
  );
}
