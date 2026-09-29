import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { Result } from "@/shared/utility/result";

export type ListTermbasesArgs = {
  fuzzyName?: string | undefined;
  offset: number;
  limit: number;
};

export type ListTermsArgs = {
  termbaseId: string;
  fuzzySource?: string | undefined;
  offset: number;
  limit: number;
};

export type CreateTermbaseArgs = {
  name: string;
  description?: string | undefined;
};

export type UpdateTermbaseArgs = CreateTermbaseArgs;

export type CreateTermArgs = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};

export type UpdateTermArgs = Omit<CreateTermArgs, "termbaseId">;

export interface TerminologyDataSource {
  listTermbases: (args: ListTermbasesArgs) => Promise<Result<TermbaseInfo[]>>;
  listTerms: (args: ListTermsArgs) => Promise<Result<TermInfo[]>>;
  createTermbase: (args: CreateTermbaseArgs) => Promise<Result<string>>;
  updateTermbase: (id: string, args: UpdateTermbaseArgs) => Promise<Result<void>>;
  deleteTermbase: (id: string) => Promise<Result<void>>;
  createTerm: (args: CreateTermArgs) => Promise<Result<string>>;
  updateTerm: (id: string, args: UpdateTermArgs) => Promise<Result<void>>;
  deleteTerm: (id: string) => Promise<Result<void>>;
}
