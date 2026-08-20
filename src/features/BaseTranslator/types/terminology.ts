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

export type TerminologyDataSource = {
  listTermbases: (
    args: ListTermbasesArgs,
  ) => Promise<Result<TermbaseInfo[]>>;
  listTerms: (args: ListTermsArgs) => Promise<Result<TermInfo[]>>;
};
