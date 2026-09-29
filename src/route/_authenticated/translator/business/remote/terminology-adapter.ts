import { useMemo } from "react";
import { useApiClient } from "@/route/business/api-context";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import {
  createTerm,
  deleteTerm,
  listTerms,
  updateTerm,
} from "@/route/_authenticated/translator/business/terminology/term-request";
import {
  createComicTermbase,
  deleteTermbase,
  listComicTermbases,
  updateTermbase,
} from "@/route/_authenticated/translator/business/terminology/termbase-request";

export function useTranslatorTerminology(
  comicId: string | undefined,
): TerminologyDataSource | undefined {
  const client = useApiClient();
  return useMemo<TerminologyDataSource | undefined>(() => {
    if (!comicId) return undefined;
    return {
      listTermbases: (args) => listComicTermbases(client, { comicId, ...args }),
      listTerms: (args) => listTerms(client, args),
      createTermbase: (args) => createComicTermbase(client, { comicId, ...args }),
      updateTermbase: (id, args) => updateTermbase(client, id, args),
      deleteTermbase: (id) => deleteTermbase(client, id),
      createTerm: (args) => createTerm(client, args),
      updateTerm: (id, args) => updateTerm(client, id, args),
      deleteTerm: (id) => deleteTerm(client, id),
    };
  }, [client, comicId]);
}
