import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  bodyOf,
  installFetch,
  lastFetchCall,
  noContent,
  okJson,
} from "@/routes/business/test/account-contract-test-utils";

import {
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "@/routes/_authenticated/_shell/workspace/business/announcement/announcement-request";
import { upsertAssignment } from "@/routes/_authenticated/business/assignment/assignment-request";
import { listAssignmentInvitations } from "@/routes/_authenticated/business/assignment-invitation/assignment-invitation-request";
import { listComments } from "@/routes/_authenticated/_shell/workspace/business/comment/comment-request";
import {
  createInvitation,
  listInvitations,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation-request";
import {
  joinMember,
  listMembers,
  updateMemberRole,
} from "@/routes/business/identity/member-request";
import { markSysMailRead } from "@/routes/_authenticated/_shell/business/mail/sys-mail-request";
import {
  allocTeamAvatarUpload,
  confirmTeamAvatarUploaded,
} from "@/routes/business/identity/team-request";
import {
  allocUserAvatarUpload,
  confirmUserAvatarUploaded,
} from "@/routes/business/identity/user-request";
import { listChapters } from "@/routes/_authenticated/business/chapter/chapter-request";
import {
  allocCoverUpload,
  archiveComic,
  listComics,
  markCoverUploaded,
} from "@/routes/_authenticated/business/comic/comic-request";
import {
  allocChapterPages,
  allocExistingPageUpload,
  deleteChapterPages,
  listPages,
  updatePage,
} from "@/routes/_authenticated/business/page/page-request";
import { listWorksets } from "@/routes/_authenticated/_shell/comic-playground/business/workset/workset-request";
import { listUnits } from "@/routes/_authenticated/translator/business/remote/translator-request";

describe("identity and endpoint contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("uses nested list endpoints and poprako-r query names", async () => {
    const fetchMock = installFetch();

    await listWorksets({ teamId: "team_1", offset: 1, limit: 20 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/worksets?offset=1&limit=20");

    fetchMock.mockResolvedValueOnce(
      okJson({
        comics: [],
        pinned_chapters: [],
        pinned_chapter_assignments: [],
      }).clone(),
    );
    await listComics({
      worksetId: "workset_1",
      includes: ["workset.team"],
      fuzzyTitle: "foo",
      stages: 3903,
      offset: 2,
      limit: 30,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/worksets/workset_1/comics" +
        "?incl=workset.team&fuzzy_title=foo&stages=3903&offset=2&limit=30",
    );

    await listMembers({
      teamId: "team_1",
      includes: ["user"],
      userNicknameKeyword: "alice",
      role: 2,
      offset: 4,
      limit: 10,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/members?team_id=team_1&offset=4&limit=10&incl=user&fuzzy_nickname=alice&role=2",
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
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages?offset=4&limit=50");

    await listUnits("page_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/units");

    await listAnnouncements({ teamId: "team_1", offset: 5, limit: 60 });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/teams/team_1/announcements?offset=5&limit=60&incl=user",
    );

    await updateAnnouncement("announcement_1", { title: "T", content: "C" });
    expect(lastFetchCall(fetchMock)).toMatchObject({
      url: "/api/v1/announcements/announcement_1",
      init: { method: "PUT" },
    });
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      id: "announcement_1",
      title: "T",
      content: "C",
    });

    await deleteAnnouncement("announcement_1");
    expect(lastFetchCall(fetchMock)).toMatchObject({
      url: "/api/v1/announcements/announcement_1",
      init: { method: "DELETE" },
    });

    await listInvitations({
      teamId: "team_1",
      offset: 6,
      limit: 70,
      includes: ["invitor"],
      isPending: true,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/teams/team_1/member-invitations?offset=6&limit=70&is_pending=true&incl=invitor",
    );

    await listAssignmentInvitations({
      chapterId: "chapter_1",
      isPending: false,
      offset: 7,
      limit: 80,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/assignment-invitations?is_pending=false&offset=7&limit=80",
    );

    await listComments({ teamId: "team_1", offset: 0, limit: 50 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/comments?offset=0&limit=50");
  });

  test("uses renamed poprako-r RPC paths and body fields", async () => {
    const fetchMock = installFetch(
      okJson({
        slot: {
          put_url: "https://upload.example/put",
          image_version: 13,
          headers: { "content-type": "image/png" },
        },
        page_id: "page_1",
        pages: [],
      }),
    );

    await allocUserAvatarUpload("user_1", {
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      extension: "png",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "png",
    });

    await confirmUserAvatarUploaded("user_1", 10);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 10 });

    await allocTeamAvatarUpload("team_1", {
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      extension: "webp",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "webp",
    });

    await confirmTeamAvatarUploaded("team_1", 11);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 11 });

    await allocCoverUpload("comic_1", {
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      extension: "jpg",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/cover/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "jpg",
    });

    await markCoverUploaded("comic_1", 12);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/cover/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 12 });

    await archiveComic("comic_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/archive");
    expect(lastFetchCall(fetchMock).init?.method).toBe("POST");

    await allocChapterPages({
      chapterId: "chapter_1",
      pages: [
        {
          rawIdent: "原稿 01.PNG",
          imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          newByteLen: 3,
          extension: "png",
        },
      ],
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      chapter_id: "chapter_1",
      pages: [
        {
          raw_ident: "原稿 01.PNG",
          image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          new_byte_len: 3,
          ext: "png",
        },
      ],
    });

    fetchMock.mockResolvedValueOnce(
      okJson({
        page_id: "page_1",
        index: 0,
        image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        ext: "png",
        slot: {
          put_url: "https://upload.example/put",
          image_version: 13,
          headers: {
            "content-type": "image/png",
          },
        },
      }).clone(),
    );
    await allocExistingPageUpload({
      pageId: "page_1",
      rawIdent: "替换稿.png",
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      extension: "png",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/image/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      raw_ident: "替换稿.png",
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "png",
    });

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
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      id: "member_1",
      roles: 5,
    });

    await joinMember("invite-code");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/join");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ code: "invite-code" });

    fetchMock.mockResolvedValueOnce(okJson({ code: "invite-code" }).clone());
    await createInvitation({ teamId: "team_1", inviteeQq: "12345", roles: 7 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/member-invitations");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      team_id: "team_1",
      invitee_qid: "12345",
      roles: 7,
    });

    await upsertAssignment({
      chapterId: "chapter_1",
      userId: "user_1",
      roles: 9,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/assignments/user_1/roles",
    );
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      chapter_id: "chapter_1",
      user_id: "user_1",
      roles: 9,
    });
  });
});
