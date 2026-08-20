import type { TermInfo } from "@/types/term";
import type { TermbaseInfo } from "@/types/termbase";
import type { Result } from "@/types/utils/result";

export type ListTermbasesArgs = {
  fuzzyName?: string;
  offset: number;
  limit: number;
};

export type ListTermsArgs = {
  termbaseId: string;
  fuzzySource?: string;
  offset: number;
  limit: number;
};

export type CreateTermbaseArgs = {
  name: string;
  description?: string;
};

export type UpdateTermbaseArgs = CreateTermbaseArgs;

export type CreateTermArgs = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string;
};

export type UpdateTermArgs = Omit<CreateTermArgs, "termbaseId">;

export type TerminologyDataSource = {
  listTermbases: (
    args: ListTermbasesArgs,
  ) => Promise<Result<TermbaseInfo[]>>;
  listTerms: (args: ListTermsArgs) => Promise<Result<TermInfo[]>>;
  createTermbase: (args: CreateTermbaseArgs) => Promise<Result<string>>;
  updateTermbase: (
    id: string,
    args: UpdateTermbaseArgs,
  ) => Promise<Result<void>>;
  deleteTermbase: (id: string) => Promise<Result<void>>;
  createTerm: (args: CreateTermArgs) => Promise<Result<string>>;
  updateTerm: (id: string, args: UpdateTermArgs) => Promise<Result<void>>;
  deleteTerm: (id: string) => Promise<Result<void>>;
};
