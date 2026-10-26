import { createApiClient, type ApiClient } from "@/api/client";
import type { ApiMember } from "@/api/identity-contract";
import { readmeAvatarImage } from "@/test-resource/readme-artwork";

const names = [
  "林间晚风",
  "夏目青禾",
  "白桃乌龙",
  "月见千寻",
  "云野",
  "橘子汽水",
  "山川遥",
  "木漏日",
  "南栀",
  "小满",
  "星野铃",
  "浅海蓝",
  "川上雪",
  "青空放映室",
  "椿与海",
  "岛屿来信",
  "秋山澪",
  "眠羊",
  "暮色书签",
  "雨后初晴",
  "森与萤",
  "一颗松子",
  "若叶",
  "远山回响",
];
const roleCombinations = [255, 6, 12, 24, 48, 96, 3, 10, 20, 40, 80, 14];
const now = Date.now();

function makeMember(name: string, index: number): ApiMember {
  const id = `readme-member-${String(index)}`;
  const lastActiveAt = now - index * 45 * 60_000;
  return {
    id,
    userId: id,
    teamId: "readme-team",
    nickname: name,
    lastActiveAt,
    roles: roleCombinations[index % roleCombinations.length] ?? 2,
    user: {
      id,
      nickname: name,
      qid: String(203_670_418 + index * 1_700_231),
      avatarUrl: readmeAvatarImage(index),
      avatarThumbnailUrl: readmeAvatarImage(index),
      isSadmin: false,
      lastActiveAt,
      createdAt: now - 180 * 86_400_000,
      updatedAt: lastActiveAt,
    },
  };
}

const members = names.map(makeMember);

function memberResponse(input: RequestInfo | URL): Promise<Response> {
  const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(address, "https://readme.local");
  if (!url.pathname.endsWith("/members")) {
    return Promise.resolve(Response.json({ code: 0, data: [] }));
  }
  const name = url.searchParams.get("fuzzy_nickname") ?? "";
  const role = Number(url.searchParams.get("role") ?? 0);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const filtered = members.filter(
    (member) => member.nickname.includes(name) && (!role || (member.roles & role) !== 0),
  );
  return Promise.resolve(Response.json({ code: 0, data: filtered.slice(offset, offset + limit) }));
}

export function createReadmeMemberClient(): ApiClient {
  return createApiClient({
    baseUrl: "https://readme.local/api/v1",
    getAccessToken: () => "readme-session",
    fetchImpl: memberResponse,
  });
}
