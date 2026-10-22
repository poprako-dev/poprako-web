import { expect, expectTypeOf, test } from "vitest";
import { toCamelCase, toSnakeCase } from "@/shared/utility/case-convert";

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
  expectTypeOf(toCamelCase(value)).toEqualTypeOf<{
    userId: number;
    isEnabled: boolean;
    records: { createdAt: string; tags: (string | number | null)[] }[];
  }>();
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
  expectTypeOf(toCamelCase({ _private: 2, user__2fa: 3, trailing__: 4 })).toEqualTypeOf<{
    Private: number;
    user2fa: number;
    trailing__: number;
  }>();
  expectTypeOf(toSnakeCase({ HTTPServerId: 1, user2Fa: 3 })).toEqualTypeOf<{
    http_server_id: number;
    user2_fa: number;
  }>();
});

test("does not transform non-plain values or primitive strings", () => {
  const date = new Date("2026-09-28T00:00:00.000Z");
  const map = new Map([["some_key", 1]]);
  const callback = (input: number): number => input;
  const input = { created_at: date, map_value: map, raw_text: "some_key", on_save: callback };
  const result = toCamelCase(input);
  expect(result).toEqual({
    createdAt: date,
    mapValue: map,
    rawText: "some_key",
    onSave: callback,
  });
  expectTypeOf(result.onSave).toEqualTypeOf<typeof callback>();
});

test("supports nullish values, arrays and empty objects", () => {
  expect(toCamelCase(null)).toBeNull();
  expect(toCamelCase<unknown>(undefined)).toBeUndefined();
  expect(toCamelCase([])).toEqual([]);
  expect(toCamelCase({})).toEqual({});
});

test("keeps dictionary keys intact in runtime values and inferred types", () => {
  const input = { upload_info: { headers: { "x-amz-meta-user_id": "v" } } };
  const result = toCamelCase(input, { preserveObjectKeys: ["headers"] });
  expect(result).toEqual({ uploadInfo: { headers: { "x-amz-meta-user_id": "v" } } });
  expectTypeOf(result).toEqualTypeOf<{
    uploadInfo: { headers: { "x-amz-meta-user_id": string } };
  }>();
  expect(toSnakeCase(result, { preserveObjectKeys: ["headers"] })).toEqual(input);
  expectTypeOf(toCamelCase({ values: new Map<string, number>() })).toEqualTypeOf<{
    values: Map<string, number>;
  }>();
  const dictionary: Record<string, number> = {};
  expectTypeOf(toSnakeCase(dictionary)).toEqualTypeOf<Record<string, number>>();
});
