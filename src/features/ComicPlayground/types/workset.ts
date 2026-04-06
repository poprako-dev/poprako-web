export type WorksetInclude = "team";

export type ListWorksetArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: WorksetInclude[];
};

export type RawListWorksetArgs = {
  team_id: string;
  offset: number;
  limit: number;
  includes?: WorksetInclude[];
};

export type CreateWorksetArgs = {
  teamId: string;
  name: string;
  description?: string;
};

export type RawCreateWorksetArgs = {
  team_id: string;
  name: string;
  description?: string;
};

export type UpdateWorksetArgs = {
  name: string;
  description?: string;
};

export type RawUpdateWorksetArgs = {
  id: string;
  name: string;
  description?: string;
};
