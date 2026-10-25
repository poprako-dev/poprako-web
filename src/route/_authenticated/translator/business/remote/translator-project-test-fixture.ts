import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Page } from "@/route/_authenticated/business/page/page";
import type { ReadySession } from "@/route/business/session/ready-session";
import type { Result } from "@/shared/utility/result";

export function projectChapter(id = "chapter"): ChapterInfo {
  return {
    id,
    comicId: `comic-${id}`,
    index: 0,
    subtitle: "",
    isPinned: false,
    pageSourceCount: 1,
    totalUnitCount: 1,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    stages: 0,
    creatorId: "user",
    createdAt: 1,
    updatedAt: 1,
  };
}

export function projectPage(index: number, chapterId = "chapter"): Page {
  return {
    id: `${chapterId}-${String(index)}`,
    chapterId,
    index,
    imageUrl: "https://images.test/page.jpg",
    isUploaded: true,
    totalUnitCount: 2,
    translatedUnitCount: 1,
    proofreadUnitCount: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}

export function projectAssignment(userId = "user", chapterId = "chapter"): AssignmentInfo {
  return { id: userId, userId, chapterId, roles: 6, createdAt: 1, updatedAt: 1 };
}

export function projectSession(generation: number): ReadySession {
  return {
    generation,
    memberInfos: [],
    userInfo: {
      id: "user",
      qq: "123",
      name: "User",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  };
}

export function deferredProjectResult<Value>(): {
  promise: Promise<Result<Value>>;
  resolve: (value: Result<Value>) => void;
} {
  let resolve!: (value: Result<Value>) => void;
  const promise = new Promise<Result<Value>>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
