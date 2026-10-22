import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { createUnit } from "../unit/unit";
import { buildUnitDiff } from "../persistence/unit-diff";
import { saveUnits } from "./translator-request";

function setup(): {
  client: ReturnType<typeof createApiClient>;
  bodies: unknown[];
} {
  const bodies: unknown[] = [];
  const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
    if (typeof init?.body !== "string") throw new TypeError("Expected a JSON body");
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(Response.json({ code: 0, data: { created_unit_ids: [] } }));
  });
  return {
    client: createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null, fetchImpl }),
    bodies,
  };
}

test("serializes both notes for new units using the API snake-case fields", async () => {
  const { client, bodies } = setup();
  const unit = { ...createUnit(0, 0, true), translationNote: "翻校", typographyNote: "嵌字" };
  await saveUnits(client, "page", buildUnitDiff([unit], []), "create");
  expect(bodies[0]).toEqual([
    {
      edit: "create",
      local_id: unit.id,
      is_bubble: true,
      is_flagged: false,
      coord: { x_coord: 0, y_coord: 0 },
      translation_note: "翻校",
      typography_note: "嵌字",
    },
  ]);
});

test("serializes note assignments and explicit clears while omitting unchanged fields", async () => {
  const { client, bodies } = setup();
  const original = createUnit(0, 0, true);
  const edited = { ...original, translationNote: "翻校", typographyNote: "嵌字" };
  await saveUnits(client, "page", buildUnitDiff([edited], [original]), "assign");
  expect(bodies[0]).toEqual([
    {
      edit: "patch",
      id: original.id,
      translation_note: { type: "assign", value: "翻校" },
      typography_note: { type: "assign", value: "嵌字" },
    },
  ]);
  await saveUnits(client, "page", buildUnitDiff([original], [edited]), "clear");
  expect(bodies[1]).toEqual([
    {
      edit: "patch",
      id: original.id,
      translation_note: { type: "clear" },
      typography_note: { type: "clear" },
    },
  ]);
  await saveUnits(
    client,
    "page",
    buildUnitDiff([{ ...edited, isFlagged: true }], [edited]),
    "flag",
  );
  expect(bodies[2]).toEqual([{ edit: "patch", id: original.id, is_flagged: true }]);
});
