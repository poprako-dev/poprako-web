import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import { hasRole, type WithRole } from "@/route/business/identity/role";
import {
  createTerm,
  deleteTerm,
  listTerms,
  updateTerm,
} from "@/route/_authenticated/business/terminology/term-request";
import {
  deleteTermbase,
  exportTermbase,
  getTermbase,
  updateTermbase,
} from "@/route/_authenticated/business/terminology/termbase-request";
import {
  createTeamTermbase,
  importTeamTermbase,
  listTeamTermbases,
} from "@/route/_authenticated/business/terminology/team-termbase-request";

export type TeamTerminologyDataSource = TerminologyDataSource & {
  getTermbase: (id: string) => Promise<Result<TermbaseInfo>>;
};

export type TeamTerminology = {
  teamId: string;
  canEdit: boolean;
  dataSource: TeamTerminologyDataSource;
};

export function canManageTeamTerminology(member: WithRole): boolean {
  return hasRole(member, "translator") || hasRole(member, "proofreader");
}

export function createTeamTerminologyDataSource(
  client: ApiClient,
  teamId: string,
): TeamTerminologyDataSource {
  return {
    listTermbases: (args) => listTeamTermbases(client, teamId, args),
    createTermbase: (args) => createTeamTermbase(client, teamId, args),
    importTermbase: (content) => importTeamTermbase(client, teamId, content),
    getTermbase: (id) => getTermbase(client, id),
    updateTermbase: (id, args) => updateTermbase(client, id, args),
    deleteTermbase: (id) => deleteTermbase(client, id),
    exportTermbase: (id, signal) => exportTermbase(client, id, signal),
    listTerms: (args) => listTerms(client, args),
    createTerm: (args) => createTerm(client, args),
    updateTerm: (id, args) => updateTerm(client, id, args),
    deleteTerm: (id) => deleteTerm(client, id),
  };
}
