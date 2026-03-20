import { useEffect, useState } from "react";
import { CirclePlus, Search } from "lucide-react";
import IconInputRow from "@/components/ui/IconInputRow";
import clsx from "clsx";
import HoverSelect from "@/components/ui/HoverSelect";
import type { Option } from "@/components/ui/HoverSelect";
import type { BinaryFilter, TripleFilter } from "../../types/types";

type Props = {
  activeFuzzyTitle?: string;
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
  onCreateComic: () => void;
};

function makeTripleOptions(prefix: string): Option[] {
  return [
    { id: "unset", text: `${prefix}·未筛选` },
    { id: "pending", text: `${prefix}·未完成` },
    { id: "in_progress", text: `${prefix}·进行中` },
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
export default function FilterHeader({
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
}: Props) {
  const [inputValue, setInputValue] = useState(activeFuzzyTitle ?? "");

  useEffect(() => {
    setInputValue(activeFuzzyTitle ?? "");
  }, [activeFuzzyTitle]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    onChangeFuzzyTitle(inputValue.trim());
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 第一行：搜索框 + 创建按钮 */}
      <div className="flex h-10 w-full flex-row items-center gap-2">
        <div className="min-w-0 flex-1" onKeyDown={handleInputKeyDown}>
          <IconInputRow
            icon={<Search />}
            placeholder="输入 标题 / 作者 / 序号... (按 Enter 搜索)"
            value={inputValue}
            onChange={(v) => setInputValue(v)}
          />
        </div>

        <button
          type="button"
          onClick={onCreateComic}
          title="创建漫画"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            "border border-slate-200 bg-white text-slate-500",
            "hover:border-slate-300 hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <CirclePlus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* 第二行：六个 workflow 状态筛选 */}
      <div className="flex h-9 w-full flex-row items-center gap-2">
        <HoverSelect
          hintText="传·未筛选"
          options={makeBinaryOptions("传")}
          checkedOptionId={activeUploadStatus}
          onSelect={(id) => onChangeUploadStatus(id as BinaryFilter)}
          isActive={activeUploadStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="翻·未筛选"
          options={makeTripleOptions("翻")}
          checkedOptionId={activeTranslateStatus}
          onSelect={(id) => onChangeTranslateStatus(id as TripleFilter)}
          isActive={activeTranslateStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="校·未筛选"
          options={makeTripleOptions("校")}
          checkedOptionId={activeProofreadStatus}
          onSelect={(id) => onChangeProofreadStatus(id as TripleFilter)}
          isActive={activeProofreadStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="嵌·未筛选"
          options={makeTripleOptions("嵌")}
          checkedOptionId={activeTypesetStatus}
          onSelect={(id) => onChangeTypesetStatus(id as TripleFilter)}
          isActive={activeTypesetStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="监·未筛选"
          options={makeBinaryOptions("监")}
          checkedOptionId={activeReviewStatus}
          onSelect={(id) => onChangeReviewStatus(id as BinaryFilter)}
          isActive={activeReviewStatus !== "unset"}
          className="flex-1"
        />
        <HoverSelect
          hintText="发·未筛选"
          options={makeBinaryOptions("发")}
          checkedOptionId={activePublishStatus}
          onSelect={(id) => onChangePublishStatus(id as BinaryFilter)}
          isActive={activePublishStatus !== "unset"}
          className="flex-1"
        />
      </div>
    </div>
  );
}
