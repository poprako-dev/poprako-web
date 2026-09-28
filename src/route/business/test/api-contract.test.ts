import { createTestApi } from "@/test-resource/api-client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  bodyOf,
  installFetch,
  lastFetchCall,
  noContent,
  okJson,
} from "@/route/business/test/account-contract-test-utils";

import { upsertAssignment } from "@/route/_authenticated/business/assignment/assignment-request";
import {
  joinMember,
  listMembers,
  updateMemberRole,
} from "@/route/business/identity/member-request";
import { allocateTeamAvatar, confirmTeamAvatar } from "@/api/identity/identity-api";
import { allocateUserAvatar, confirmUserAvatar } from "@/api/identity/identity-api";
import { listChapters } from "@/route/_authenticated/business/chapter/chapter-request";
import {
  allocCoverUpload,
  archiveComic,
  listComics,
  markCoverUploaded,
} from "@/route/_authenticated/business/comic/comic-request";
import {
  allocChapterPages,
  allocExistingPageUpload,
  deleteChapterPages,
  listPages,
  updatePage,
} from "@/route/_authenticated/business/page/page-request";
import { listWorksets } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-request";
import { listUnits } from "@/route/_authenticated/translator/business/remote/translator-request";

describe("identity and endpoint contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("uses nested list endpoints and poprako-r query names", async () => {
    const fetchMock = installFetch();

    await listWorksets(createTestApi(), { teamId: "team_1", offset: 1, limit: 20 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/worksets?offset=1&limit=20");

    fetchMock.mockResolvedValueOnce(
      okJson({
        comics: [],
        pinned_chapters: [],
        pinned_chapter_assignments: [],
      }).clone(),
    );
    await listComics(createTestApi(), {
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

    await listMembers(createTestApi(), {
      teamId: "team_1",
      includes: ["user"],
      nickname: "alice",
      role: 2,
      offset: 4,
      limit: 10,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/members?team_id=team_1&incl=user&offset=4&limit=10&fuzzy_nickname=alice&role=2",
    );

    await listChapters(createTestApi(), {
      comicId: "comic_1",
      includes: ["creator"],
      offset: 3,
      limit: 40,
    });
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/comics/comic_1/chapters?incl=creator&offset=3&limit=40",
    );

    await listPages(createTestApi(), { chapterId: "chapter_1", offset: 4, limit: 50 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages?offset=4&limit=50");

    await listUnits(createTestApi(), "page_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/units");

    // Announcement, comment, and member-invitation contracts have focused endpoint tests.
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

    await allocateUserAvatar(createTestApi(), "user_1", {
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      ext: "png",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "png",
    });

    await confirmUserAvatar(createTestApi(), "user_1", 10);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/users/user_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 10 });

    await allocateTeamAvatar(createTestApi(), "team_1", {
      imageHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      newByteLen: 3,
      ext: "webp",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/alloc");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      image_hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      new_byte_len: 3,
      ext: "webp",
    });

    await confirmTeamAvatar(createTestApi(), "team_1", 11);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/teams/team_1/avatar/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 11 });

    await allocCoverUpload(createTestApi(), "comic_1", {
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

    await markCoverUploaded(createTestApi(), "comic_1", 12);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/cover/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 12 });

    await archiveComic(createTestApi(), "comic_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/comics/comic_1/archive");
    expect(lastFetchCall(fetchMock).init?.method).toBe("POST");

    await allocChapterPages(createTestApi(), {
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
    await allocExistingPageUpload(createTestApi(), {
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

    await updatePage(createTestApi(), "page_1", { isUploaded: true, imageVersion: 13 });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/image/mark-uploaded");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ image_version: 13 });

    await deleteChapterPages(createTestApi(), "chapter_1");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/pages");

    // System-mail contracts are covered with the store/controller lifecycle tests.
  });

  test("uses roles and code fields for role-bearing endpoints", async () => {
    const fetchMock = installFetch(noContent());

    await updateMemberRole(createTestApi(), "member_1", 5);
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/member_1/roles");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      roles: 5,
    });

    await joinMember(createTestApi(), "invite-code");
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/join");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({ code: "invite-code" });

    await upsertAssignment(createTestApi(), {
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
