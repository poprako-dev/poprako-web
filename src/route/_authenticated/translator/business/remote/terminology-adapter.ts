import { appendTermbase } from "@/route/_authenticated/business/terminology/termbase-append-request";
import { useMemo } from "react";
import { useApiClient } from "@/route/business/api-context";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import {
  createTerm,
  deleteTerm,
  listTerms,
  updateTerm,
} from "@/route/_authenticated/business/terminology/term-request";
import {
  createComicTermbase,
  deleteTermbase,
  exportTermbase,
  importComicTermbase,
  listComicTermbases,
  updateTermbase,
} from "@/route/_authenticated/business/terminology/termbase-request";

export function useTranslatorTerminology(
  comicId: string | undefined,
): TerminologyDataSource | undefined {
  const client = useApiClient();
  return useMemo<TerminologyDataSource | undefined>(() => {
    if (!comicId) return undefined;
    return {
      appendTermbase: (id, content) => appendTermbase(client, id, content),
      importTermbase: (content) => importComicTermbase(client, comicId, content),
      exportTermbase: (id, signal) => exportTermbase(client, id, signal),
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
