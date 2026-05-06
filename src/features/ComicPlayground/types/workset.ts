export type ListWorksetArgs = {
  teamId: string;
  offset: number;
  limit: number;
};

export type RawListWorksetArgs = {
  team_id: string;
  offset: number;
  limit: number;
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
