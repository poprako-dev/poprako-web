import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  header: ReactNode;
  body: ReactNode;
};

// 个人工作区布局组件，负责展示个人工作区的整体布局结构
// 整体为上下结构，从上到下依次为：
// 1. 简单导航栏
// 2. 欢迎文本
// 3. 三种统计数据
// 4. AssignmentList 组件
//
// 主体是 AssignmentList
export default function WorkspaceLayout({ header, body }: Props) {
  return (
    <div
      className={clsx(
        "flex h-full w-full min-w-0 flex-col overflow-x-hidden bg-[#FBFBFC]",
      )}
    >
      <div className={clsx("shrink-0")}>{header}</div>
      <div
        className={clsx(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
          "px-4 py-4 sm:px-6 sm:py-6",
        )}
      >
        {body}
      </div>
    </div>
  );
}
