import type { ChapterInfo, ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { ViewMode } from "../../types/types";

type Props = {
  comic: ComicInfo;
  mode: ViewMode;
  onLoadLatestChapter: (comicId: string) => Promise<ChapterInfo | null>;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[]>;
  onClick: () => void;
};

// 漫画卡片的容器
// 同样是一个纯展示组件，不持有任何状态，所有数据和事件都通过 props 传入
export default function ComicCard() {
  return <div></div>;
}
