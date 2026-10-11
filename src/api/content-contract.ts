import {
  decodeBoolean,
  decodeNullable,
  decodeNumber,
  decodeObject,
  decodeString,
} from "@/api/contract";
import { decodeApiTeam, decodeApiUser } from "@/api/identity-contract";
import type { ApiTeam, ApiUser } from "@/api/identity-contract";
import type { WorksetResponse } from "@/api/workset/workset-api";
export type ComicResponse = {
  id: string;
  worksetId: string;
  workset?: WorksetResponse | null | undefined;
  team?: ApiTeam | null | undefined;
  title: string;
  author: string;
  description?: string | null | undefined;
  index: number;
  chapterCount: number;
  coverUrl?: string | null | undefined;
  coverThumbnailUrl?: string | null | undefined;
  creatorId: string;
  creator?: ApiUser | null | undefined;
  isArchived: boolean;
  archivedAt?: number | null | undefined;
  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};
export type ChapterResponse = {
  id: string;
  comicId: string;
  comic?: ComicResponse | null | undefined;
  creatorId: string;
  creator?: ApiUser | null | undefined;
  index: number;
  subtitle: string;
  pageCount: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
  isPinned: boolean;
  stages: number;
  createdAt: number;
  updatedAt: number;
};
export type AssignmentResponse = {
  id: string;
  chapterId: string;
  chapter?: ChapterResponse | null | undefined;
  userId: string;
  user?: ApiUser | null | undefined;
  roles: number;
  createdAt: number;
  updatedAt: number;
};

export function decodeAssignment(value: unknown): AssignmentResponse {
  const object = decodeObject(value, "assignment");
  return {
    id: decodeString(object["id"], "assignment.id"),
    chapterId: decodeString(object["chapterId"], "assignment.chapterId"),
    ...(object["chapter"] === undefined
      ? {}
      : {
          chapter: object["chapter"] === null ? null : decodeChapterResponse(object["chapter"]),
        }),
    userId: decodeString(object["userId"], "assignment.userId"),
    ...(object["user"] === undefined
      ? {}
      : {
          user: object["user"] === null ? null : decodeApiUser(object["user"]),
        }),
    roles: decodeNumber(object["roles"], "assignment.roles"),
    createdAt: decodeNumber(object["createdAt"], "assignment.createdAt"),
    updatedAt: decodeNumber(object["updatedAt"], "assignment.updatedAt"),
  };
}

function decodeComicWorkset(value: unknown): WorksetResponse {
  const { id, teamId, index, comicCount, name, description, createdAt, updatedAt } = decodeObject(
    value,
    "comic.workset",
  );
  return {
    id: decodeString(id, "comic.workset.id"),
    teamId: decodeString(teamId, "comic.workset.teamId"),
    index: decodeNumber(index, "comic.workset.index"),
    comicCount: decodeNumber(comicCount, "comic.workset.comicCount"),
    name: decodeString(name, "comic.workset.name"),
    ...(description === undefined
      ? {}
      : {
          description:
            description === null ? null : decodeString(description, "comic.workset.description"),
        }),
    createdAt: decodeNumber(createdAt, "comic.workset.createdAt"),
    updatedAt: decodeNumber(updatedAt, "comic.workset.updatedAt"),
  };
}

export function decodeComicResponse(value: unknown): ComicResponse {
  const {
    id,
    worksetId,
    workset,
    team,
    title,
    author,
    description,
    index,
    chapterCount,
    coverUrl,
    coverThumbnailUrl,
    creatorId,
    creator,
    lastActiveAt,
    createdAt,
    updatedAt,
    isArchived,
    archivedAt,
  } = decodeObject(value, "comic");
  return {
    id: decodeString(id, "comic.id"),
    worksetId: decodeString(worksetId, "comic.worksetId"),
    ...decodeComicRelationships(workset, team),
    title: decodeString(title, "comic.title"),
    author: decodeString(author, "comic.author"),
    ...decodeComicDescription(description),
    index: decodeNumber(index, "comic.index"),
    chapterCount: decodeNumber(chapterCount, "comic.chapterCount"),
    ...(coverUrl === undefined
      ? {}
      : {
          coverUrl: decodeNullable(coverUrl, (item) => decodeString(item, "comic.coverUrl")),
        }),
    ...(coverThumbnailUrl === undefined
      ? {}
      : {
          coverThumbnailUrl: decodeNullable(coverThumbnailUrl, (item) =>
            decodeString(item, "comic.coverThumbnailUrl"),
          ),
        }),
    creatorId: decodeString(creatorId, "comic.creatorId"),
    ...decodeComicCreator(creator),
    ...decodeComicArchive(isArchived, archivedAt),
    lastActiveAt: decodeNumber(lastActiveAt, "comic.lastActiveAt"),
    createdAt: decodeNumber(createdAt, "comic.createdAt"),
    updatedAt: decodeNumber(updatedAt, "comic.updatedAt"),
  };
}

function decodeComicDescription(description: unknown): Pick<ComicResponse, "description"> {
  return description === undefined
    ? {}
    : {
        description: decodeNullable(description, (item) => decodeString(item, "comic.description")),
      };
}

function decodeComicArchive(
  isArchived: unknown,
  archivedAt: unknown,
): Pick<ComicResponse, "isArchived" | "archivedAt"> {
  return {
    isArchived: decodeBoolean(isArchived, "comic.isArchived"),
    ...(archivedAt === undefined
      ? {}
      : {
          archivedAt: decodeNullable(archivedAt, (item) => decodeNumber(item, "comic.archivedAt")),
        }),
  };
}

function decodeComicRelationships(
  workset: unknown,
  team: unknown,
): Pick<ComicResponse, "workset" | "team"> {
  return {
    ...(workset === undefined
      ? {}
      : { workset: workset === null ? null : decodeComicWorkset(workset) }),
    ...(team === undefined ? {} : { team: team === null ? null : decodeApiTeam(team) }),
  };
}

function decodeComicCreator(creator: unknown): Pick<ComicResponse, "creator"> {
  return creator === undefined ? {} : { creator: creator === null ? null : decodeApiUser(creator) };
}

export function decodeChapterResponse(value: unknown): ChapterResponse {
  const object = decodeObject(value, "chapter");
  return {
    id: decodeString(object["id"], "chapter.id"),
    comicId: decodeString(object["comicId"], "chapter.comicId"),
    ...(object["comic"] === undefined
      ? {}
      : {
          comic: object["comic"] === null ? null : decodeComicResponse(object["comic"]),
        }),
    creatorId: decodeString(object["creatorId"], "chapter.creatorId"),
    ...(object["creator"] === undefined
      ? {}
      : {
          creator: object["creator"] === null ? null : decodeApiUser(object["creator"]),
        }),
    index: decodeNumber(object["index"], "chapter.index"),
    subtitle: decodeString(object["subtitle"], "chapter.subtitle"),
    pageCount: decodeNumber(object["pageCount"], "chapter.pageCount"),
    totalUnitCount: decodeNumber(object["totalUnitCount"], "chapter.totalUnitCount"),
    translatedUnitCount: decodeNumber(object["translatedUnitCount"], "chapter.translatedUnitCount"),
    proofreadUnitCount: decodeNumber(object["proofreadUnitCount"], "chapter.proofreadUnitCount"),
    isPinned: decodeBoolean(object["isPinned"], "chapter.isPinned"),
    stages: decodeNumber(object["stages"], "chapter.stages"),
    createdAt: decodeNumber(object["createdAt"], "chapter.createdAt"),
    updatedAt: decodeNumber(object["updatedAt"], "chapter.updatedAt"),
  };
}
