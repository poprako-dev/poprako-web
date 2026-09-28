import { afterEach, expect, test } from "vitest";
import { useAppStore } from "./session-store";

afterEach(() => {
  useAppStore.getState().setAccessToken(null);
  localStorage.clear();
});
test("real Zustand hydration restores the legacy app-store payload", async () => {
  useAppStore.getState().setAccessToken(null);
  localStorage.setItem(
    "app-store",
    JSON.stringify({
      state: { accessToken: "legacy-token", selectedTeamId: "legacy-team" },
      version: 0,
    }),
  );
  await useAppStore.persist.rehydrate();
  expect(useAppStore.getState()).toMatchObject({
    accessToken: "legacy-token",
    selectedTeamId: "legacy-team",
    loginState: null,
  });
  expect(useAppStore.persist.hasHydrated()).toBe(true);
});
test("real storage writes never persist ready identity or session generation", () => {
  useAppStore.getState().setAccessToken("new-token");
  const serialized = localStorage.getItem("app-store");
  if (!serialized) throw new Error("Zustand did not persist session");
  expect(JSON.parse(serialized)).toEqual({
    state: { accessToken: "new-token", selectedTeamId: null },
    version: 0,
  });
  useAppStore.getState().setAccessToken(null);
  expect(JSON.parse(localStorage.getItem("app-store") ?? "null")).toEqual({
    state: { accessToken: null, selectedTeamId: null },
    version: 0,
  });
});
