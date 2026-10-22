import type { ReadySession } from "@/route/business/session/ready-session";

export const workspaceUser = {
  id: "reader",
  name: "Reader",
  qq: "123",
  avatarUrl: "",
  isSuperAdmin: false,
  lastActiveAt: 1,
  createdAt: 1,
  updatedAt: 1,
};

export function workspaceSession(generation = 1): ReadySession {
  return { generation, userInfo: workspaceUser, memberInfos: [] };
}

export function deferredResponse(): {
  promise: Promise<Response>;
  resolve: (data: unknown) => void;
} {
  let resolve: (response: Response) => void = () => {
    throw new Error("Pending response is not initialized");
  };
  const promise = new Promise<Response>((accept) => {
    resolve = accept;
  });
  return {
    promise,
    resolve: (data) => {
      resolve(Response.json({ code: 0, data }));
    },
  };
}

export function workspaceComment(
  id: string,
  teamId = "team-a",
): {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: number;
} {
  return { id, team_id: teamId, user_id: "reader", content: id, created_at: 1 };
}

export function onlineUserResponse(id: string): {
  id: string;
  nickname: string;
  qid: string;
  avatar_url: null;
  is_sadmin: boolean;
  last_active_at: number;
  created_at: number;
  updated_at: number;
} {
  return {
    id,
    nickname: id,
    qid: "123",
    avatar_url: null,
    is_sadmin: false,
    last_active_at: 1,
    created_at: 1,
    updated_at: 1,
  };
}
