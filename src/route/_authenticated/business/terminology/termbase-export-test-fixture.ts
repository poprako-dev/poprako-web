import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Result } from "@/shared/utility/result";
import type { TerminologyDataSource } from "./terminology-contract";
import type { TermbaseInfo } from "./termbase";

export const comicTermbase: TermbaseInfo = {
  id: "comic-base",
  comicId: "comic-1",
  name: "角色称谓",
  termCount: 2,
  creatorId: "user-1",
  createdAt: 1,
  updatedAt: 2,
};

export const teamTermbase: TermbaseInfo = {
  ...comicTermbase,
  id: "team-base",
  comicId: undefined,
  teamId: "team-1",
  name: "团队术语",
};

export const exportContent = '{"name":"角色称谓","description":null,"terms":[]}';

export type DeferredExport = {
  promise: Promise<Result<string>>;
  resolve: (result: Result<string>) => void;
};

export type ExportDataSource = {
  [Key in keyof TerminologyDataSource]: Mock<TerminologyDataSource[Key]>;
};

export function deferredExport(): DeferredExport {
  let resolve: (result: Result<string>) => void = () => undefined;
  const promise = new Promise<Result<string>>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

export function createExportDataSource(): ExportDataSource {
  return {
    appendTermbase: vi.fn(),
    importTermbase: vi.fn<TerminologyDataSource["importTermbase"]>(),
    exportTermbase: vi.fn<TerminologyDataSource["exportTermbase"]>(),
    listTermbases: vi.fn<TerminologyDataSource["listTermbases"]>(({ fuzzyName }) =>
      Promise.resolve({
        success: true,
        data: [comicTermbase, teamTermbase].filter((base) => base.name.includes(fuzzyName ?? "")),
      }),
    ),
    listTerms: vi
      .fn<TerminologyDataSource["listTerms"]>()
      .mockResolvedValue({ success: true, data: [] }),
    createTermbase: vi.fn<TerminologyDataSource["createTermbase"]>(),
    updateTermbase: vi.fn<TerminologyDataSource["updateTermbase"]>(),
    deleteTermbase: vi.fn<TerminologyDataSource["deleteTermbase"]>(),
    createTerm: vi.fn<TerminologyDataSource["createTerm"]>(),
    updateTerm: vi.fn<TerminologyDataSource["updateTerm"]>(),
    deleteTerm: vi.fn<TerminologyDataSource["deleteTerm"]>(),
  } satisfies TerminologyDataSource;
}
