type detailUserFixture = {
  id: string;
  qid: string;
  nickname: string;
  avatar_url: null;
  is_sadmin: boolean;
  last_active_at: number;
  created_at: number;
  updated_at: number;
};

export function detailUser(id = "reader"): detailUserFixture {
  return {
    id,
    qid: id,
    nickname: id,
    avatar_url: null,
    is_sadmin: false,
    last_active_at: 1,
    created_at: 1,
    updated_at: 1,
  };
}

type detailComicFixture = {
  id: string;
  workset_id: string;
  index: number;
  chapter_count: number;
  is_archived: boolean;
  title: string;
  author: string;
  description: null;
  cover_url: null;
  creator_id: string;
  creator: {
    id: string;
    qid: string;
    nickname: string;
    avatar_url: null;
    is_sadmin: boolean;
    last_active_at: number;
    created_at: number;
    updated_at: number;
  };
  last_active_at: number;
  created_at: number;
  updated_at: number;
  workset: {
    id: string;
    team_id: string;
    index: number;
    name: string;
    description: string;
    comic_count: number;
    created_at: number;
    updated_at: number;
  };
  team: {
    id: string;
    name: string;
    description: string;
    avatar_url: null;
    created_at: number;
    updated_at: number;
  };
};

export function detailComic(id = "comic-b", teamId = "team-b"): detailComicFixture {
  return {
    id,
    workset_id: `workset-${id}`,
    index: 0,
    chapter_count: 1,
    is_archived: false,
    title: id,
    author: "author",
    description: null,
    cover_url: null,
    creator_id: "reader",
    creator: detailUser(),
    last_active_at: 1,
    created_at: 1,
    updated_at: 1,
    workset: {
      id: `workset-${id}`,
      team_id: teamId,
      index: 0,
      name: "workset",
      description: "",
      comic_count: 1,
      created_at: 1,
      updated_at: 1,
    },
    team: {
      id: teamId,
      name: teamId,
      description: "",
      avatar_url: null,
      created_at: 1,
      updated_at: 1,
    },
  };
}

type detailChapterFixture = {
  id: string;
  comic_id: string;
  creator_id: string;
  index: number;
  subtitle: string;
  page_count: number;
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
  is_pinned: boolean;
  stages: number;
  created_at: number;
  updated_at: number;
};

export function detailChapter(comicId = "comic-b"): detailChapterFixture {
  return {
    id: `pinned-${comicId}`,
    comic_id: comicId,
    creator_id: "reader",
    index: 0,
    subtitle: "pinned",
    page_count: 0,
    total_unit_count: 0,
    translated_unit_count: 0,
    proofread_unit_count: 0,
    is_pinned: true,
    stages: 0,
    created_at: 1,
    updated_at: 1,
  };
}

type detailMemberFixture = {
  id: string;
  user_id: string;
  team_id: string;
  user: {
    id: string;
    qid: string;
    nickname: string;
    avatar_url: null;
    is_sadmin: boolean;
    last_active_at: number;
    created_at: number;
    updated_at: number;
  };
  nickname: string;
  last_active_at: number;
  roles: number;
  created_at: number;
  updated_at: number;
};

export function detailMember(teamId: string, userId = "reader", roles = 2): detailMemberFixture {
  return {
    id: `${teamId}-${userId}`,
    user_id: userId,
    team_id: teamId,
    user: detailUser(userId),
    nickname: userId,
    last_active_at: 1,
    roles,
    created_at: 1,
    updated_at: 1,
  };
}
