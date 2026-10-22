export type ListWorksetArgs = {
  teamId: string;
  offset: number;
  limit: number;
  signal?: AbortSignal | undefined;
};

export type CreateWorksetArgs = {
  teamId: string;
  name: string;
  description?: string | undefined;
};

export type UpdateWorksetArgs = {
  name: string;
  description?: string | undefined;
};
