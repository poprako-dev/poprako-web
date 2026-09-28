import { ComicPlayground } from "@/route/_authenticated/_shell/comic-playground/business/ComicPlayground";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { TranslatorDestination } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import type { ReactElement } from "react";

function ComicPlaygroundPage(): ReactElement {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const onChangeSearch = (comicId: string | null, chapterId: string | null): void => {
    void navigate({
      to: "/comic-playground",
      replace: true,
      search: (previous) => {
        const next = Object.fromEntries(
          Object.entries(previous).filter(([key]) => key !== "comicId" && key !== "chapterId"),
        );
        if (comicId) {
          next["comicId"] = comicId;
        }
        if (comicId && chapterId) {
          next["chapterId"] = chapterId;
        }
        return next as Record<string, string> & { comicId?: string; chapterId?: string };
      },
    });
  };
  const onNavigateToTranslator = (destination: TranslatorDestination): void => {
    void navigate({
      to: "/translator/$chapterId/$pageId",
      params: { chapterId: destination.chapterId, pageId: destination.pageId },
      search: {
        returnTo: destination.returnTo,
        comicId: destination.comicId,
        chapterId: destination.chapterId,
        ...(destination.readOnly ? { readOnly: "true" } : {}),
      },
    });
  };
  return (
    <div className="h-full min-h-0">
      <ComicPlayground
        search={search}
        onChangeSearch={onChangeSearch}
        onNavigateToTranslator={onNavigateToTranslator}
      />
    </div>
  );
}
export const Route = createFileRoute("/_authenticated/_shell/comic-playground/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): Record<string, string> & { comicId?: string; chapterId?: string } => {
    const values = Object.fromEntries(
      Object.entries(search).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    return values;
  },
  component: ComicPlaygroundPage,
});
