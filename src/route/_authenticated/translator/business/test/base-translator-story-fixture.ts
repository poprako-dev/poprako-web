import type { UserInfo } from "../../../../business/identity/user";
import type { ComponentProps } from "react";
import type { BaseTranslator } from "@/route/_authenticated/translator/business/BaseTranslator";
import {
  type UnitInfo,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { PageImageQuality } from "@/route/_authenticated/business/page/page";
import { createUnitSaveFixture } from "@/route/_authenticated/translator/business/test/unit-save-fixture";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import type { UnitSearchTransformDataSource } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import {
  DEMO_IMAGE,
  mockProject,
  mockUnits,
  mockUsers,
} from "@/route/_authenticated/translator/business/test/base-translator-story-data";

type BaseTranslatorProps = ComponentProps<typeof BaseTranslator>;

function createPageUnits(units: UnitInfo[]): Map<string, UnitInfo[]> {
  return new Map(
    mockProject.pages.map((page) => [
      page.id,
      units.map((unit) => ({ ...unit, id: `${page.id}-${unit.id}` })),
    ]),
  );
}

function listStoryFlaggedStats(
  unitsByPage: Map<string, UnitInfo[]>,
): Promise<{ pageId: string; index: number; flaggedUnitCount: number }[]> {
  return Promise.resolve(
    mockProject.pages
      .map((page) => ({
        pageId: page.id,
        index: page.index,
        flaggedUnitCount: (unitsByPage.get(page.id) ?? []).filter((unit) => unit.isFlagged).length,
      }))
      .filter((stat) => stat.flaggedUnitCount > 0),
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
async function mockCompleteStage(stage: "translate" | "proofread"): Promise<void> {
  console.log("[mock] onCompleteStage", stage); // eslint-disable-line no-console
}

// eslint-disable-next-line @typescript-eslint/require-await
async function mockResolveUser(userId: string): Promise<
  | {
      success: true;
      data: UserInfo;
      error?: never;
    }
  | { success: false; error: string; data?: never }
> {
  const user = mockUsers.get(userId);
  return user
    ? { success: true as const, data: user }
    : { success: false as const, error: `Unknown user: ${userId}` };
}

export const mockTerminology: TerminologyDataSource = {
  // eslint-disable-next-line @typescript-eslint/require-await
  listTermbases: async () => ({
    success: true,
    data: [
      {
        id: "termbase-1",
        comicId: "comic-1",
        name: "角色称谓",
        description: "本作角色姓名与敬称",
        termCount: 2,
        creatorId: "mock-user",
        createdAt: 10,
        updatedAt: 20,
      },
    ],
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  listTerms: async () => ({
    success: true,
    data: [
      {
        id: "term-1",
        termbaseId: "termbase-1",
        source: "団長",
        targets: ["团长"],
        creatorId: "mock-user",
        createdAt: 10,
        updatedAt: 20,
      },
    ],
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  createTermbase: async () => ({ success: true, data: "termbase-new" }),
  // eslint-disable-next-line @typescript-eslint/require-await
  updateTermbase: async () => ({ success: true, data: undefined }),
  // eslint-disable-next-line @typescript-eslint/require-await
  deleteTermbase: async () => ({ success: true, data: undefined }),
  // eslint-disable-next-line @typescript-eslint/require-await
  createTerm: async () => ({ success: true, data: "term-new" }),
  // eslint-disable-next-line @typescript-eslint/require-await
  updateTerm: async () => ({ success: true, data: undefined }),
  // eslint-disable-next-line @typescript-eslint/require-await
  deleteTerm: async () => ({ success: true, data: undefined }),
};

function createUnitSearchTransform(
  unitsByPage: Map<string, UnitInfo[]>,
): UnitSearchTransformDataSource {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    search: async ({ part, phrase }) => {
      return {
        success: true,
        data: [...unitsByPage].flatMap(([pageId, units]) =>
          units.flatMap((unit) => {
            const text =
              part === "translatedText" ? unitTranslatedText(unit) : unitProofreadText(unit);
            return text?.includes(phrase) ? [{ pageId, unit }] : [];
          }),
        ),
      };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    transform: async ({ part, origin, target, unitIds }) => {
      const selectedIds = new Set(unitIds);
      for (const [pageId, units] of unitsByPage) {
        unitsByPage.set(
          pageId,
          units.map((unit) => {
            if (!selectedIds.has(unit.id)) return unit;

            if (part === "translatedText") {
              return {
                ...unit,
                translatedText: unitTranslatedText(unit)?.replaceAll(origin, () => target),
              };
            }
            return {
              ...unit,
              proofreadText: unitProofreadText(unit)?.replaceAll(origin, () => target),
            };
          }),
        );
      }
      return { success: true, data: undefined };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    reloadPage: async (pageId) => ({
      success: true,
      data: unitsByPage.get(pageId) ?? [],
    }),
  };
}

export function createStoryArgs({
  canTranslate,
  canProofread,
  units = mockUnits,
}: {
  canTranslate: boolean;
  canProofread: boolean;
  units?: UnitInfo[] | undefined;
}): BaseTranslatorProps {
  const unitsByPage = createPageUnits(units);

  return {
    project: mockProject,
    canTranslate,
    canProofread,
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadUnits: async (pageId: string) => unitsByPage.get(pageId) ?? [],
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadPageImage: async (_pageId: string, _quality: PageImageQuality) => {
      return DEMO_IMAGE;
    },
    onSaveUnits: createUnitSaveFixture(unitsByPage),
    onResolveUser: mockResolveUser,
    onCompleteStage: mockCompleteStage,
    onListPageUnitFlaggedStats: () => listStoryFlaggedStats(unitsByPage),
    // eslint-disable-next-line @typescript-eslint/require-await
    onListPageUnitDiffStats: async () =>
      ["page-2", "page-3"].map((pageId, index) => ({
        pageId,
        index: index + 1,
        translatedUnitCount: 10,
        editedUnitCount: 3,
        proofreaderAppendUnitCount: 2,
      })),
    currentUserId: "mock-user",
    terminology: mockTerminology,
    unitSearchTransform: createUnitSearchTransform(unitsByPage),
    startPageId: "page-1",
    startMode: "auto",
    onExit: () => {
      console.log("[mock] onExit"); // eslint-disable-line no-console
    },
  };
}
