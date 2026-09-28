import { describe, expect, test } from "vitest";
import { toCamelCase, toSnakeCase } from "@/shared/utility/case-convert";

describe("case conversion", () => {
  test("converts nested object keys and array entries, leaving values unchanged", () => {
    const value = {
      user_id: 0,
      is_enabled: false,
      records: [{ created_at: "2026-09-28", tags: ["a_b", 2, null] }],
    };

    expect(toCamelCase(value)).toEqual({
      userId: 0,
      isEnabled: false,
      records: [{ createdAt: "2026-09-28", tags: ["a_b", 2, null] }],
    });
  });

  test("uses the shared acronym and underscore conversion rules", () => {
    expect(toCamelCase({ http_server_id: 1, _private: 2, user_2fa: 3 })).toEqual({
      httpServerId: 1,
      Private: 2,
      user2fa: 3,
    });
    expect(toSnakeCase({ httpServerId: 1, user2Fa: 3 })).toEqual({
      http_server_id: 1,
      user2_fa: 3,
    });
  });

  test("does not transform non-plain values or primitive strings", () => {
    const date = new Date("2026-09-28T00:00:00.000Z");
    const map = new Map([["some_key", 1]]);
    const input = { created_at: date, map_value: map, raw_text: "some_key" };
    expect(toCamelCase(input)).toEqual({
      createdAt: date,
      mapValue: map,
      rawText: "some_key",
    });
  });

  test("supports nullish values, arrays and empty objects", () => {
    expect(toCamelCase(null)).toBeNull();
    expect(toCamelCase(undefined)).toBeUndefined();
    expect(toCamelCase([])).toEqual([]);
    expect(toCamelCase({})).toEqual({});
  });
});
