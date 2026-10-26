import { readmePageImage } from "@/test-resource/readme-artwork";
import type { EditorProps } from "../editor/editor-props";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import type { UnitSearchTransformDataSource } from "../contract/unit-search-transform";
import type { UnitInfo } from "../unit/unit";
import { createStoryArgs, mockTerminology } from "./base-translator-story-fixture";
import { createUnitSaveFixture } from "./unit-save-fixture";
import {
  createReadmeAnnotations,
  readmeProject,
  readmeUnits,
  resolveReadmeUser,
} from "./readme-translator-data";

const terms = [
  { source: "風待郵便局", targets: ["风待邮便局"], comment: "地名；全篇保持统一。" },
  { source: "明日", targets: ["明天"], comment: "本话标题与台词统一使用“明天”。" },
  { source: "凪", targets: ["风停", "无风"], comment: "按上下文区分动作和状态。" },
  { source: "灯台", targets: ["灯塔"], comment: "小镇北侧的旧灯塔。" },
];

const terminology: TerminologyDataSource = {
  ...mockTerminology,
  listTermbases: () =>
    Promise.resolve({
      success: true,
      data: [
        {
          id: "readme-terms",
          name: "风待邮便局 · 用语表",
          comicId: "readme-wind-post",
          description: "角色、地名与本话关键词",
          termCount: terms.length,
          creatorId: "readme-translator",
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    }),
  listTerms: () =>
    Promise.resolve({
      success: true,
      data: terms.map((term, index) => ({
        ...term,
        id: `readme-term-${String(index)}`,
        termbaseId: "readme-terms",
        creatorId: "readme-translator",
        createdAt: 0,
        updatedAt: 0,
      })),
    }),
};

function createSearch(pages: Map<string, UnitInfo[]>): UnitSearchTransformDataSource {
  return {
    search: ({ part, phrase }) =>
      Promise.resolve({
        success: true,
        data: [...pages].flatMap(([pageId, units]) =>
          units.flatMap((unit) => (unit[part]?.includes(phrase) ? [{ pageId, unit }] : [])),
        ),
      }),
    transform: ({ part, origin, target, unitIds }) => {
      const selected = new Set(unitIds);
      for (const [pageId, units] of pages) {
        pages.set(
          pageId,
          units.map((unit) =>
            selected.has(unit.id)
              ? { ...unit, [part]: unit[part]?.replaceAll(origin, () => target) }
              : unit,
          ),
        );
      }
      return Promise.resolve({ success: true, data: undefined });
    },
    reloadPage: (pageId) => Promise.resolve({ success: true, data: pages.get(pageId) ?? [] }),
  };
}

export function createReadmeTranslatorArgs(): EditorProps {
  const pages = new Map(readmeProject.pages.map((page) => [page.id, readmeUnits(page.id)]));
  const defaults = createStoryArgs({ canTranslate: true, canProofread: true });
  return {
    ...defaults,
    project: readmeProject,
    currentUserId: "readme-proofreader",
    startPageId: "readme-page-1",
    startMode: "proofread",
    annotations: createReadmeAnnotations(),
    onLoadUnits: (pageId) => Promise.resolve(pages.get(pageId) ?? []),
    onLoadPageImage: () => Promise.resolve(readmePageImage),
    onSaveUnits: createUnitSaveFixture(pages),
    onResolveUser: resolveReadmeUser,
    onCompleteStage: () => Promise.resolve(),
    onExit: () => undefined,
    onListPageUnitFlaggedStats: () =>
      Promise.resolve(
        readmeProject.pages.map((page) => ({
          pageId: page.id,
          index: page.index,
          flaggedUnitCount: 1,
        })),
      ),
    onListPageUnitDiffStats: () =>
      Promise.resolve(
        readmeProject.pages.map((page) => ({
          pageId: page.id,
          index: page.index,
          translatedUnitCount: 8,
          editedUnitCount: 6,
          proofreaderAppendUnitCount: 0,
        })),
      ),
    terminology,
    unitSearchTransform: createSearch(pages),
  };
}
