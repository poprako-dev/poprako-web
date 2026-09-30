import type {
  UnitSearchMatch,
  UnitSearchTransformDataSource,
  UnitTextPart,
} from "../contract/unit-search-transform";
import { unitId } from "../unit/unit";
import { normalizeSearchPhrase } from "../search-transform/search-transform";
import type { Result, ResultFailure } from "@/shared/utility/result";

type Options = {
  dataSource: UnitSearchTransformDataSource;
  part: UnitTextPart;
  currentPageId: string | undefined;
  flush: () => Promise<void>;
  runExclusive: (operation: () => Promise<void>) => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
  navigate: (pageId: string, unitId?: string) => Promise<void>;
};

type SearchSnapshot = { matches: UnitSearchMatch[]; phrase: string };

type TransformResult =
  | { status: "failed"; failure: ResultFailure }
  | { status: "refresh-failed" }
  | { status: "ready"; matches: UnitSearchMatch[] };

export function createEditorSearchCoordinator(options: Options): {
  search: (phrase: string) => Promise<Result<SearchSnapshot>>;
  transform: (
    phrase: string,
    target: string,
    matches: UnitSearchMatch[],
  ) => Promise<TransformResult>;
  navigate: (pageId: string, unitId?: string) => Promise<void>;
} {
  async function search(phrase: string): Promise<Result<SearchSnapshot>> {
    try {
      await options.flush();
    } catch (error) {
      console.error("[EditorSearch] 搜索前保存失败", error);
      return { success: false, error: "当前页保存失败，未执行搜索" };
    }
    const normalizedPhrase = normalizeSearchPhrase(phrase);
    const result = await options.dataSource.search({
      part: options.part,
      phrase: normalizedPhrase,
    });
    return result.success
      ? { success: true, data: { matches: result.data, phrase: normalizedPhrase } }
      : result;
  }

  async function transform(
    phrase: string,
    target: string,
    matches: UnitSearchMatch[],
  ): Promise<TransformResult> {
    let outcome: TransformResult = { status: "refresh-failed" };
    await options.runExclusive(async () => {
      const result = await options.dataSource.transform({
        part: options.part,
        origin: phrase,
        target,
        unitIds: matches.map((match) => unitId(match.unit)),
      });
      if (!result.success) {
        console.error("[EditorSearch] 替换失败", result.error);
        outcome = { status: "failed", failure: result };
        return;
      }
      const refreshed = await Promise.allSettled([
        options.dataSource.search({ part: options.part, phrase }),
        matches.some((match) => match.pageId === options.currentPageId)
          ? options.refreshCurrentPage()
          : Promise.resolve(),
      ]);
      const searchResult = refreshed[0];
      if (
        searchResult.status === "fulfilled" &&
        searchResult.value.success &&
        refreshed[1].status === "fulfilled"
      ) {
        outcome = { status: "ready", matches: searchResult.value.data };
      } else {
        console.error("[EditorSearch] 替换后的数据刷新失败", refreshed);
      }
    });
    return outcome;
  }

  return { search, transform, navigate: options.navigate };
}

export type EditorSearchCoordinator = ReturnType<typeof createEditorSearchCoordinator>;
