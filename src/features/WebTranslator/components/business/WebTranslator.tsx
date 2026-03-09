import type { Project } from "@/types/project";

type Props = {
  chapterId: string;
  onExit: () => void;
};

// 对不依赖 infra 的 BaseTranslator 组件的 web 版封装
export default function WebTranslator({ chapterId, onExit }: Props) {}
