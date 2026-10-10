import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { JSX } from "react";
import { WebReviewer } from "../../business/WebReviewer";
import {
  parseWorkbenchSearch,
  workbenchReturnDestination,
} from "@/route/_authenticated/business/navigation/workbench-navigation";
export const Route = createFileRoute("/_authenticated/reviewer/$chapterId/$pageId/")({
  validateSearch: parseWorkbenchSearch,
  component: ReviewerPage,
});
function ReviewerPage(): JSX.Element {
  const { chapterId, pageId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  function exit(): void {
    const destination = workbenchReturnDestination(search, "reviewer");
    if (destination) void navigate(destination);
    else router.history.back();
  }
  return <WebReviewer chapterId={chapterId} startPageId={pageId} onExit={exit} />;
}
