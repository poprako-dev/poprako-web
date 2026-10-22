import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";
import { loadComicDetail } from "./detail-request";
import type { ComicDetailData } from "./detail-request";

export type DetailScope = { userId: string; generation: number; teamId: string | null };
type Entry = {
  comicId: string;
  data: ComicDetailData | undefined;
  expiresAt: number;
  pending: Promise<Result<ComicDetailData>> | undefined;
};

const FRESH_MS = 30_000;
const MAX_ENTRIES = 32;
const caches = new WeakMap<ApiClient, Map<string, Entry>>();
const subscriptions = new WeakMap<ApiClient, Map<string, Set<(discard: boolean) => void>>>();

function cacheFor(client: ApiClient): Map<string, Entry> {
  let cache = caches.get(client);
  if (!cache) {
    cache = new Map();
    caches.set(client, cache);
  }
  return cache;
}

function entryKey(scope: DetailScope, comicId: string): string {
  return JSON.stringify([scope.userId, scope.generation, scope.teamId, comicId]);
}

export function peekComicDetail(
  client: ApiClient,
  scope: DetailScope,
  comicId: string,
): ComicDetailData | undefined {
  return caches.get(client)?.get(entryKey(scope, comicId))?.data;
}

export function invalidateComicDetails(
  client: ApiClient,
  scope: DetailScope,
  comicId: string,
  discard = false,
): void {
  const cache = caches.get(client);
  const key = entryKey(scope, comicId);
  const entry = cache?.get(key);
  if (cache && entry) {
    if (discard) cache.delete(key);
    else cache.set(key, { ...entry, expiresAt: 0, pending: undefined });
  }
  for (const listener of subscriptions.get(client)?.get(key) ?? []) listener(discard);
}

export function subscribeComicDetails(
  client: ApiClient,
  scope: DetailScope,
  comicId: string,
  listener: (discard: boolean) => void,
): () => void {
  const groups = subscriptions.get(client) ?? new Map<string, Set<(discard: boolean) => void>>();
  subscriptions.set(client, groups);
  const key = entryKey(scope, comicId);
  const listeners = groups.get(key) ?? new Set<(discard: boolean) => void>();
  groups.set(key, listeners);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) groups.delete(key);
  };
}

export function loadCachedComicDetail(
  client: ApiClient,
  scope: DetailScope,
  comicId: string,
): Promise<Result<ComicDetailData>> {
  const cache = cacheFor(client);
  const key = entryKey(scope, comicId);
  const previous = cache.get(key);
  if (previous?.pending) return previous.pending;
  if (previous?.data && previous.expiresAt > Date.now()) {
    cache.delete(key);
    cache.set(key, previous);
    return Promise.resolve({ success: true, data: previous.data });
  }
  const entry: Entry = { comicId, data: previous?.data, expiresAt: 0, pending: undefined };
  cache.delete(key);
  cache.set(key, entry);
  trimCache(cache);
  entry.pending = requestDetail(client, cache, key, entry);
  return entry.pending;
}

function trimCache(cache: Map<string, Entry>): void {
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

async function requestDetail(
  client: ApiClient,
  cache: Map<string, Entry>,
  key: string,
  entry: Entry,
): Promise<Result<ComicDetailData>> {
  try {
    const result = await loadComicDetail(client, entry.comicId);
    if (cache.get(key) === entry && result.success) {
      entry.data = result.data;
      entry.expiresAt = Date.now() + FRESH_MS;
    }
    return result;
  } finally {
    if (cache.get(key) === entry) {
      entry.pending = undefined;
      if (!entry.data) cache.delete(key);
    }
  }
}
