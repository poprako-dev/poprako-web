import { createApiClient, type ApiClient } from "@/api/client";
import type { TermInfo } from "@/route/_authenticated/business/terminology/term";
import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import { createTeamTerminologyFixture } from "./team-terminology-fixture";
import type { TeamTerminology } from "./team-terminology";

const now = Date.now();
const entries: [string, string[], string][] = [
  ["星渡りの旅人", ["渡星旅人"], "主角所属的古老旅团，统一使用此译名。"],
  ["月灯りの図書館", ["月灯图书馆"], "位于王都北侧的私人图书馆。"],
  ["風待ちの丘", ["候风之丘"], "第一卷第 3 话首次出现的地名。"],
  ["魔導書", ["魔导书"], "与普通魔法书区分，保留「导」字。"],
  ["アリア", ["艾莉亚"], "女主角，称呼「アリ」译作「小艾」。"],
  ["黎明の騎士団", ["黎明骑士团"], "王室直属骑士团。"],
  ["星屑の欠片", ["星尘碎片"], "用于启动传送阵的素材。"],
  ["結界術", ["结界术"], "防御系魔法的统称。"],
  ["銀の森", ["银之森"], "精灵居住地，不译作「银色森林」。"],
  ["灯守り", ["守灯人"], "负责维护城镇灯塔的职业。"],
  ["おかえり", ["欢迎回来"], "角色间固定呼应台词，注意对应语气。"],
  ["旅のしおり", ["旅途书签"], "全卷贯穿的重要道具。"],
];

const libraryNames = [
  ["星之旅途 · 全卷共用术语", "角色、地名与世界观用语，随连载持续维护。"],
  ["月灯图书馆 · 人物称呼", "人物姓名、昵称与敬语的统一译法。"],
  ["夏日来信 · 校对备忘", "校园场景、社团活动及日常惯用表达。"],
  ["魔法与异世界 · 共用词", "跨作品复用的魔法、种族和职业用语。"],
  ["街角咖啡馆 · 菜单与文化", "饮品、甜点与文化注释。"],
  ["拟声词与效果字", "常见拟声词及嵌字表达参考。"],
] as const;

const bases: TermbaseInfo[] = libraryNames.map(([name, description], index) => ({
  id: `readme-base-${String(index)}`,
  teamId: "readme-team",
  name,
  description,
  termCount: index === 0 ? entries.length : 18 + index * 7,
  creatorId: "readme-member-0",
  createdAt: now - 30 * 86_400_000,
  updatedAt: now - index * 86_400_000,
}));
const terms: TermInfo[] = entries.map(([source, targets, comment], index) => ({
  id: `readme-term-${String(index)}`,
  termbaseId: "readme-base-0",
  source,
  targets,
  comment,
  creatorId: "readme-member-0",
  createdAt: now - 30 * 86_400_000,
  updatedAt: now,
}));

export function createReadmeTerminology(): TeamTerminology {
  return {
    teamId: "readme-team",
    canEdit: true,
    dataSource: {
      ...createTeamTerminologyFixture(),
      listTermbases: ({ fuzzyName, offset, limit }) =>
        Promise.resolve({
          success: true,
          data: bases
            .filter((base) => base.name.includes(fuzzyName ?? ""))
            .slice(offset, offset + limit),
        }),
      getTermbase: (id) => {
        const base = bases.find((item) => item.id === id);
        return Promise.resolve(
          base ? { success: true, data: base } : { success: false, error: "术语库不存在" },
        );
      },
      listTerms: ({ fuzzySource, offset, limit }) =>
        Promise.resolve({
          success: true,
          data: terms
            .filter((term) => term.source.includes(fuzzySource ?? ""))
            .slice(offset, offset + limit),
        }),
    },
  };
}

export function createReadmeUtilitiesClient(): ApiClient {
  return createApiClient({
    baseUrl: "https://readme.local/api/v1",
    getAccessToken: () => "readme-session",
    fetchImpl: () => Promise.resolve(Response.json({ code: 0, data: [] })),
  });
}
