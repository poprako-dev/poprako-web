import type { ComponentProps } from "react";
import type { ComicList } from "../comic-list/ComicList";
import { packComicArchives, type ExportArchives } from "./archive-export";

export const storyDate = new Date("2026-10-25T00:00:00Z");
const timestamp = storyDate.getTime();

function noop(): void {
  return;
}

export const archiveListProps: ComponentProps<typeof ComicList> = {
  worksets: [
    {
      id: "workset-1",
      teamId: "team-1",
      index: 0,
      name: "短篇集",
      description: "",
      comicCount: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  activeWorksetId: "workset-1",
  onChangeWorkset: noop,
  onCreateWorkset: noop,
  onCreateComic: noop,
  onComicClick: noop,
  onChangeFuzzyTitle: noop,
  activeUploadStatus: "unset",
  activeTranslateStatus: "unset",
  activeProofreadStatus: "unset",
  activeTypesetStatus: "unset",
  activeReviewStatus: "unset",
  activePublishStatus: "unset",
  onChangeUploadStatus: noop,
  onChangeTranslateStatus: noop,
  onChangeProofreadStatus: noop,
  onChangeTypesetStatus: noop,
  onChangeReviewStatus: noop,
  onChangePublishStatus: noop,
  onLoadComics: (offset) =>
    Promise.resolve({
      success: true,
      data:
        offset > 0
          ? []
          : [
              {
                id: "comic-1",
                worksetId: "workset-1",
                title: "雨后的街角",
                author: "青木",
                description: "",
                index: 0,
                chapterCount: 3,
                creatorId: "user-1",
                coverUrl: "",
                isCoverUploaded: false,
                lastActiveAt: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
    }),
};

export function emptyArchiveExport(
  _months: readonly string[] | undefined,
  _signal: AbortSignal,
): ReturnType<ExportArchives> {
  return Promise.resolve({ success: true, data: null });
}

export async function sampleArchiveExport(
  months: readonly string[] | undefined,
  signal: AbortSignal,
): ReturnType<ExportArchives> {
  const archives = Object.fromEntries(
    (months ?? ["2026-08", "2026-09"]).map((month) => [
      month,
      [JSON.stringify({ comic_id: `sample-${month}`, title: "雨后的街角" })],
    ]),
  );
  return { success: true, data: await packComicArchives(archives, "示例汉化组", signal) };
}

export function pendingArchiveExport(
  _months: readonly string[] | undefined,
  signal: AbortSignal,
): ReturnType<ExportArchives> {
  return new Promise((resolve) => {
    signal.addEventListener(
      "abort",
      () => {
        resolve({ success: false, error: "请求已取消", failureKind: "aborted" });
      },
      { once: true },
    );
  });
}
