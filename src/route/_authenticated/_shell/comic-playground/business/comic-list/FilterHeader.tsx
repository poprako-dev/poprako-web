import { type JSX, useEffect, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { IconInputRow } from "@/shared/component/IconInputRow";
import { ComicListActions } from "./ComicListActions";
import { HoverSelect } from "@/shared/component/hover-select/HoverSelect";
import type { Option } from "@/shared/component/hover-select/hover-select-type";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/route/_authenticated/_shell/business/comic-list/comic-list";

type Props = {
  progressDisabled?: boolean;
  activeFuzzyTitle?: string | undefined;
  // 只有用户按下 enter 后才触发
  onChangeFuzzyTitle: (title: string) => void;

  activeUploadStatus: BinaryFilter;
  activeTranslateStatus: TripleFilter;
  activeProofreadStatus: TripleFilter;
  activeTypesetStatus: TripleFilter;
  activeReviewStatus: BinaryFilter;
  activePublishStatus: BinaryFilter;
  onChangeUploadStatus: (status: BinaryFilter) => void;
  onChangeTranslateStatus: (status: TripleFilter) => void;
  onChangeProofreadStatus: (status: TripleFilter) => void;
  onChangeTypesetStatus: (status: TripleFilter) => void;
  onChangeReviewStatus: (status: BinaryFilter) => void;
  onChangePublishStatus: (status: BinaryFilter) => void;

  // 通知父组件显示创建漫画的 modal
  onCreateComic?: (() => void) | undefined;
  onExportArchives?: (() => void) | undefined;
  // 切换侧边栏展开/收起
  onToggleSidebar?: (() => void) | undefined;
};

function makeTripleOptions(prefix: string): Option[] {
  return [
    { id: "unset", text: `${prefix}·未筛选` },
    { id: "pending", text: `${prefix}·未完成` },
    { id: "ongoing", text: `${prefix}·进行中` },
    { id: "completed", text: `${prefix}·已完成` },
  ];
}

function makeBinaryOptions(prefix: string): Option[] {
  return [
    { id: "unset", text: `${prefix}·未筛选` },
    { id: "pending", text: `${prefix}·未完成` },
    { id: "completed", text: `${prefix}·已完成` },
  ];
}

// 受控实际上为受控组件，但是负责显示和传递修改过滤条件的 UI，具体的过滤条件 state 由父组件维护
// 该组件不负责筛选 workset，workset 筛选应该由 workset filter sidebar 组件负责
export function FilterHeader({
  progressDisabled = false,
  activeFuzzyTitle,
  onChangeFuzzyTitle,
  activeUploadStatus,
  activeTranslateStatus,
  activeProofreadStatus,
  activeTypesetStatus,
  activeReviewStatus,
  activePublishStatus,
  onChangeUploadStatus,
  onChangeTranslateStatus,
  onChangeProofreadStatus,
  onChangeTypesetStatus,
  onChangeReviewStatus,
  onChangePublishStatus,
  onCreateComic,
  onExportArchives,
  onToggleSidebar,
}: Props): JSX.Element {
  const [inputValue, setInputValue] = useState(activeFuzzyTitle ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
    setInputValue(activeFuzzyTitle ?? "");
  }, [activeFuzzyTitle]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter" || isKeyboardComposing(event.nativeEvent)) return;
    onChangeFuzzyTitle(inputValue.trim());
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 第一行：搜索框 + 创建按钮 */}
      <div className="flex h-10 w-full flex-row items-center gap-2">
        <div className="min-w-0 flex-1" role="group" tabIndex={-1}>
          <IconInputRow
            icon={<Search />}
            placeholder="标题 / 作者 / 序号..."
            value={inputValue}
            onKeyDown={handleKeyDown}
            onChange={(v) => {
              setInputValue(v);
            }}
          />
        </div>

        <ComicListActions
          onCreateComic={onCreateComic}
          onExportArchives={onExportArchives}
          onToggleSidebar={onToggleSidebar}
        />
      </div>

      {/* 第二行：六个 workflow 状态筛选 */}
      <fieldset
        key={String(progressDisabled)}
        disabled={progressDisabled}
        aria-label="进度筛选"
        className={clsx(
          "grid min-w-0 w-full grid-cols-2 items-center gap-2 sm:grid-cols-3 lg:grid-cols-6",
          progressDisabled && "pointer-events-none opacity-50",
        )}
      >
        <HoverSelect
          hintText="传·未筛选"
          options={makeBinaryOptions("传")}
          checkedOptionId={activeUploadStatus}
          onSelect={(id) => {
            onChangeUploadStatus(id as BinaryFilter);
          }}
          isActive={activeUploadStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="翻·未筛选"
          options={makeTripleOptions("翻")}
          checkedOptionId={activeTranslateStatus}
          onSelect={(id) => {
            onChangeTranslateStatus(id as TripleFilter);
          }}
          isActive={activeTranslateStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="校·未筛选"
          options={makeTripleOptions("校")}
          checkedOptionId={activeProofreadStatus}
          onSelect={(id) => {
            onChangeProofreadStatus(id as TripleFilter);
          }}
          isActive={activeProofreadStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="嵌·未筛选"
          options={makeTripleOptions("嵌")}
          checkedOptionId={activeTypesetStatus}
          onSelect={(id) => {
            onChangeTypesetStatus(id as TripleFilter);
          }}
          isActive={activeTypesetStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="监·未筛选"
          options={makeBinaryOptions("监")}
          checkedOptionId={activeReviewStatus}
          onSelect={(id) => {
            onChangeReviewStatus(id as BinaryFilter);
          }}
          isActive={activeReviewStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="发·未筛选"
          options={makeBinaryOptions("发")}
          checkedOptionId={activePublishStatus}
          onSelect={(id) => {
            onChangePublishStatus(id as BinaryFilter);
          }}
          isActive={activePublishStatus !== "unset"}
          className="flex-1"
        />
      </fieldset>
    </div>
  );
}
