import type { Page } from "./page";

// 对正在翻校的项目定义的接口
export type Project = {
  id: string;

  title: string;
  author: string;

  pageCount: number;

  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  pages: Page[];
};

export function getProjectFullName(project: Project) {
  return `[${project.author}] ${project.title}`;
}
