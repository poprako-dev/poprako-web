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
  return {
    search: (phrase) => searchUnits(options, phrase),
    transform: (phrase, target, matches) => transformUnits(options, phrase, target, matches),
    navigate: options.navigate,
  };
}

async function searchUnits(options: Options, phrase: string): Promise<Result<SearchSnapshot>> {
  try {
    await options.flush();
  } catch (error) {
    console.error("[EditorSearch] 搜索前保存失败", error);
    return { success: false, error: "当前页保存失败，未执行搜索" };
  }
  const normalizedPhrase = normalizeSearchPhrase(phrase);
  const result = await options.dataSource.search({ part: options.part, phrase: normalizedPhrase });
  return result.success
    ? { success: true, data: { matches: result.data, phrase: normalizedPhrase } }
    : result;
}

async function transformUnits(
  options: Options,
  phrase: string,
  target: string,
  matches: UnitSearchMatch[],
): Promise<TransformResult> {
  let outcome: TransformResult = { status: "refresh-failed" };
  await options.runExclusive(async () => {
    outcome = await transformWithinExclusive(options, phrase, target, matches);
  });
  return outcome;
}

async function transformWithinExclusive(
  options: Options,
  phrase: string,
  target: string,
  matches: UnitSearchMatch[],
): Promise<TransformResult> {
  const result = await options.dataSource.transform({
    part: options.part,
    origin: phrase,
    target,
    unitIds: matches.map((match) => unitId(match.unit)),
  });
  if (!result.success) {
    console.error("[EditorSearch] 替换失败", result.error);
    return { status: "failed", failure: result };
  }
  return refreshAfterTransform(options, phrase, matches);
}

async function refreshAfterTransform(
  options: Options,
  phrase: string,
  matches: UnitSearchMatch[],
): Promise<TransformResult> {
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
    return { status: "ready", matches: searchResult.value.data };
  }
  console.error("[EditorSearch] 替换后的数据刷新失败", refreshed);
  return { status: "refresh-failed" };
}

export type EditorSearchCoordinator = ReturnType<typeof createEditorSearchCoordinator>;
