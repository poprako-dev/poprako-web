import { beforeEach, describe, expect, test, vi } from "vitest";

import { listAnnouncements } from "@/api/announcement";
import { upsertAssignment } from "@/api/assignment";
import { listComments } from "@/api/comment";
import { listInvitations, createInvitation } from "@/api/invitation";
import { updateMemberRole, joinMember, listMyMembers } from "@/api/member";
import { markSysMailRead, listSysMails } from "@/api/sysMail";
import { reserveTeamAvatarUpload, confirmTeamAvatarUploaded } from "@/api/team";
import { reserveUserAvatarUpload, confirmUserAvatarUploaded } from "@/api/user";
import { listChapters, updateChapter, importChapter, exportChapter } from "@/features/ComicPlayground/api/chapter";
import { listComics, markCoverUploaded, reserveCoverUpload } from "@/features/ComicPlayground/api/comic";
import { listPages, reserveChapterPages, reserveExistingPageUpload, updatePage, deleteChapterPages } from "@/features/ComicPlayground/api/page";
import { listWorksets } from "@/features/ComicPlayground/api/workset";
import { listUnits, saveUnits } from "@/features/WebTranslator/api/translator";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function okJson(data: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify({ code: 0, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function noContent() {
  return Promise.resolve(new Response(null, { status: 204 }));
}

function installFetch(response: Response | Promise<Response> = okJson([])) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return Promise.resolve(response).then((res) => res.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastFetchCall(fetchMock: ReturnType<typeof installFetch>): FetchCall {
  const call = fetchMock.mock.calls.at(-1);
  expect(call).toBeDefined();
  return {
    url: String(call![0]),
    init: call![1] as RequestInit | undefined,
  };
}

function bodyOf(call: FetchCall): unknown {
  return JSON.parse(String(call.init?.body));
}

describe("poprako-r API migration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("uses nested list endpoints and poprako-r query names", async () => {
    const fetchMock = installFetch();

    await listWorksets({ teamId: "team_1", offset: 1, limit: 20 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/worksets?offset=1&limit=20");

    await listComics({
      worksetId: "workset_1",
      includes: ["workset.team"],
      fuzzyTitle: "foo",
      offset: 2,
      limit: 30,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/worksets/workset_1/comics?incl=workset.team&fuzzy_title=foo&offset=2&limit=30",
    );

    await listChapters({
      comicId: "comic_1",
      includes: ["creator"],
      offset: 3,
      limit: 40,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/comics/comic_1/chapters?incl=creator&offset=3&limit=40",
    );

    await listPages({ chapterId: "chapter_1", offset: 4, limit: 50 });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/pages?offset=4&limit=50",
    );

    await listUnits("page_1");
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/pages/page_1/units?offset=0&limit=500",
    );

    await listAnnouncements({ teamId: "team_1", offset: 5, limit: 60 });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/teams/team_1/announcements?offset=5&limit=60&incl=user",
    );

    await listInvitations({ teamId: "team_1", offset: 6, limit: 70, includes: ["invitor"] });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/teams/team_1/member-invitations?offset=6&limit=70&incl=invitor",
    );

    await listComments({ teamId: "team_1", offset: 0, limit: 50 });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/teams/team_1/comments?offset=0&limit=50",
    );
  });

  test("uses renamed poprako-r RPC paths and body fields", async () => {
    const fetchMock = installFetch(okJson({
      put_url: "https://upload.example/put",
      avatar_version: 11,
      cover_version: 12,
      image_version: 13,
      page_id: "page_1",
      creations: [],
    }));

    await reserveUserAvatarUpload("user_1", "png");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/reserve");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ file_ext: "png" });

    await confirmUserAvatarUploaded("user_1", 10);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ avatar_version: 10 });

    await reserveTeamAvatarUpload("team_1", { fileExtension: "webp" });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/reserve");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ file_ext: "webp" });

    await confirmTeamAvatarUploaded("team_1", 11);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ avatar_version: 11 });

    await reserveCoverUpload("comic_1", "jpg");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/cover/reserve");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ file_ext: "jpg" });

    await markCoverUploaded("comic_1", 12);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/cover/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ cover_version: 12 });

    await reserveChapterPages({ chapterId: "chapter_1", pageCount: 3, fileExtension: "png" });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages/reserve");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      chapter_id: "chapter_1",
      page_count: 3,
      file_ext: "png",
    });

    await reserveExistingPageUpload({ pageId: "page_1", fileExtension: "png" });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/image/reserve");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ file_ext: "png" });

    await updatePage("page_1", { isUploaded: true, imageVersion: 13 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/image/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 13 });

    await deleteChapterPages("chapter_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages");

    await markSysMailRead("mail_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/system-mails/mark-read");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ ids: ["mail_1"] });
  });

  test("uses roles and code fields for role-bearing endpoints", async () => {
    const fetchMock = installFetch(noContent());

    await updateMemberRole({ id: "member_1", roles: 5 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/member_1/roles");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ id: "member_1", roles: 5 });

    await joinMember("invite-code");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/join");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ code: "invite-code" });

    fetchMock.mockResolvedValueOnce((await okJson({ code: "invite-code" })).clone());
    await createInvitation({ teamId: "team_1", inviteeQq: "12345", roles: 7 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/member-invitations");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      team_id: "team_1",
      invitee_qid: "12345",
      roles: 7,
    });

    await upsertAssignment({ chapterId: "chapter_1", userId: "user_1", roles: 9 });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/assignments/user_1/roles",
    );
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      chapter_id: "chapter_1",
      user_id: "user_1",
      roles: 9,
    });
  });

  test("saves units with the poprako-r create-save-delete schema", async () => {
    const fetchMock = installFetch(okJson({
      local_id_mappers: [{ local_id: "local_1", unit_id: "unit_99" }],
      total_unit_count: 2,
      translated_unit_count: 1,
      proofread_unit_count: 0,
    }));
    const diff: UnitDiff = {
      ops: [
        {
          oper: "create",
          localId: "local_1",
          beforeId: "unit_1",
          xCoord: 0.1,
          yCoord: 0.2,
          isBubble: true,
          isProofread: false,
          translatedText: "hello",
          lastTranslatorId: "user_translator",
          proofreadText: null,
          lastProofreaderId: null,
        },
        {
          oper: "save",
          id: "unit_1",
          beforeId: undefined,
          xCoord: 0.3,
          yCoord: 0.4,
          isBubble: false,
          isProofread: true,
          translatedText: null,
          lastTranslatorId: null,
          proofreadText: "done",
          lastProofreaderId: "user_proofreader",
        },
        { oper: "delete", id: "unit_deleted" },
      ],
    };

    const result = await saveUnits("page_1", diff);

    expect(result).toEqual({
      success: true,
      data: {
        localIdMappers: [{ localId: "local_1", unitId: "unit_99" }],
        totalUnitCount: 2,
        translatedUnitCount: 1,
        proofreadUnitCount: 0,
      },
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/units/save");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      page_id: "page_1",
      diff: {
        page_id: "page_1",
        opers: [
          {
            oper: "create",
            local_id: "local_1",
            before_id: "unit_1",
            x_coord: 0.1,
            y_coord: 0.2,
            is_bubble: true,
            is_proofread: false,
            translated_text: "hello",
            last_translator_id: "user_translator",
            proofread_text: null,
            last_proofreader_id: null,
          },
          {
            oper: "save",
            id: "unit_1",
            x_coord: 0.3,
            y_coord: 0.4,
            is_bubble: false,
            is_proofread: true,
            translated_text: null,
            last_translator_id: null,
            proofread_text: "done",
            last_proofreader_id: "user_proofreader",
          },
          { oper: "delete", id: "unit_deleted" },
        ],
      },
    });
  });

  test("maps renamed poprako-r response fields", async () => {
    let fetchMock = installFetch(okJson({
      unit_infos: [{
        id: "unit_1",
        page_id: "page_1",
        index: 0,
        is_bubble: true,
        is_proofread: false,
        x_coord: 0.1,
        y_coord: 0.2,
        translated_text: "hello",
        created_at: 1,
        updated_at: 2,
      }],
      total_unit_count: 1,
      translated_unit_count: 1,
      proofread_unit_count: 0,
    }));
    const units = await listUnits("page_1");
    expect(units.success && units.data.units[0]?.id).toBe("unit_1");

    fetchMock = installFetch(okJson([{
      id: "member_1",
      user_id: "user_1",
      nickname: "member",
      last_active_at: 1,
      team_id: "team_1",
      roles: 128,
      created_at: 1,
      updated_at: 2,
      team: {
        id: "team_1",
        name: "Team",
        description: "Desc",
        avatar_url: null,
        workset_next_index: 1,
        created_at: 1,
        updated_at: 2,
      },
    }]));
    const members = await listMyMembers({ ownerId: "user_1" });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/members?owner_id=user_1&incl=team&offset=0&limit=100",
    );
    expect(members[0]?.roles).toBe(128);
    expect(members[0]?.team?.id).toBe("team_1");

    fetchMock = installFetch(okJson([{
      id: "mail_1",
      title: "T",
      content: "C",
      read: false,
      created_at: 1,
    }]));
    const mails = await listSysMails();
    expect(mails.success && mails.data[0]?.read).toBe(false);

    fetchMock = installFetch(okJson({
      comic_id: "comic_1",
      chapter_id: "chapter_1",
      pages: [],
    }));
    const exported = await exportChapter("chapter_1");
    expect(exported.success && exported.data.chapterId).toBe("chapter_1");

    expect(fetchMock).toHaveBeenCalled();
  });

  test("uses chapter stage/import export routes from poprako-r", async () => {
    const fetchMock = installFetch(noContent());

    await updateChapter("chapter_1", { subtitle: "new", isPinned: true });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1");
    expect(lastFetchCall(fetchMock).init?.method).toBe("PATCH");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      id: "chapter_1",
      subtitle: "new",
      pin: true,
    });

    fetchMock.mockResolvedValueOnce((await okJson({
      imported_page_count: 1,
      imported_unit_count: 2,
    })).clone());
    await importChapter({ chapterId: "chapter_1", content: "x", format: "lp" });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/translations/import");

    const exportFetchMock = installFetch(okJson({}));
    await exportChapter("chapter_1");
    expect(lastFetchCall(exportFetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export?format=poprako",
    );
  });
});
