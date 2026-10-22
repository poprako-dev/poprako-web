import type { ApiClient } from "@/api/client";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";

type CachedWorksets = {
  worksets: WorksetInfo[];
  activeWorksetId: string;
  updatedAt: number;
  stale: boolean;
};
type TeamCache = {
  data?: CachedWorksets | undefined;
  revision: number;
  listeners: Set<() => void>;
};
type ClientCache = { generation: number; teams: Map<string, TeamCache> };

const caches = new WeakMap<ApiClient, ClientCache>();
const FRESH_MS = 30_000;
const MAX_TEAMS = 8;

export type WorksetScope = {
  client: ApiClient;
  generation: number;
  teamId: string | null;
};

export function readWorksetCache(scope: WorksetScope): CachedWorksets | undefined {
  const cache = caches.get(scope.client);
  if (!scope.teamId || cache?.generation !== scope.generation) return undefined;
  return cache.teams.get(scope.teamId)?.data;
}

export function hasFreshWorksets(scope: WorksetScope): boolean {
  const entry = readWorksetCache(scope);
  return entry !== undefined && !entry.stale && Date.now() - entry.updatedAt < FRESH_MS;
}

function ensureTeamCache(scope: WorksetScope): TeamCache {
  if (!scope.teamId) throw new Error("作品集缓存缺少团队");
  let cache = caches.get(scope.client);
  if (cache?.generation !== scope.generation) {
    cache = { generation: scope.generation, teams: new Map() };
    caches.set(scope.client, cache);
  }
  const entry = cache.teams.get(scope.teamId) ?? { revision: 0, listeners: new Set<() => void>() };
  cache.teams.delete(scope.teamId);
  cache.teams.set(scope.teamId, entry);
  if (cache.teams.size > MAX_TEAMS) {
    const oldest = cache.teams.keys().next().value;
    if (oldest !== undefined) cache.teams.delete(oldest);
  }
  return entry;
}

export function writeWorksetCache(
  scope: WorksetScope,
  worksets: WorksetInfo[],
  activeWorksetId: string,
): void {
  ensureTeamCache(scope).data = { worksets, activeWorksetId, updatedAt: Date.now(), stale: false };
}

export function selectCachedWorkset(scope: WorksetScope, activeWorksetId: string): void {
  const entry = readWorksetCache(scope);
  if (entry) entry.activeWorksetId = activeWorksetId;
}

export function trackWorksetRead(scope: WorksetScope): () => boolean {
  const entry = ensureTeamCache(scope);
  const revision = entry.revision;
  return () => {
    const cache = caches.get(scope.client);
    return (
      cache?.generation === scope.generation &&
      cache.teams.get(scope.teamId ?? "") === entry &&
      entry.revision === revision
    );
  };
}

export function subscribeWorksetInvalidation(
  scope: WorksetScope,
  listener: () => void,
): () => void {
  const entry = ensureTeamCache(scope);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function invalidateWorksets(client: ApiClient, generation: number, teamId?: string): void {
  const cache = caches.get(client);
  if (cache?.generation !== generation) return;
  const entries = teamId ? [cache.teams.get(teamId)] : [...cache.teams.values()];
  for (const entry of entries) {
    if (!entry) continue;
    entry.revision++;
    if (entry.data) entry.data.stale = true;
    for (const listener of entry.listeners) listener();
  }
}
