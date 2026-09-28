import { useMemo } from "react";
import type { TerminologyDataSource } from "@/routes/_authenticated/translator/business/contract/terminology";
import {
  createTerm,
  deleteTerm,
  listTerms,
  updateTerm,
} from "@/routes/_authenticated/translator/business/terminology/term-request";
import {
  createComicTermbase,
  deleteTermbase,
  listComicTermbases,
  updateTermbase,
} from "@/routes/_authenticated/translator/business/terminology/termbase-request";

export function useTranslatorTerminology(
  comicId: string | undefined,
): TerminologyDataSource | undefined {
  return useMemo<TerminologyDataSource | undefined>(() => {
    if (!comicId) return undefined;
    return {
      listTermbases: (args) => listComicTermbases({ comicId, ...args }),
      listTerms,
      createTermbase: (args) => createComicTermbase({ comicId, ...args }),
      updateTermbase,
      deleteTermbase,
      createTerm,
      updateTerm,
      deleteTerm,
    };
  }, [comicId]);
}
