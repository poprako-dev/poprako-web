import type { CamelCase, SnakeCase } from "./case-convert-type";

export type CaseConversionOptions<Preserved extends string = string> = {
  preserveObjectKeys?: readonly Preserved[] | undefined;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_+([a-zA-Z0-9])/g, (_, character: string) => character.toUpperCase());
}

function camelToSnakeKey(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function transformKeys(
  value: unknown,
  mapKey: (key: string) => string,
  preserveObjectKeys: ReadonlySet<string>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, mapKey, preserveObjectKeys));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      mapKey(key),
      preserveObjectKeys.has(key) ? item : transformKeys(item, mapKey, preserveObjectKeys),
    ]),
  );
}

export function toCamelCase<Value, Preserved extends string = never>(
  value: Value,
  options: CaseConversionOptions<Preserved> = {},
): CamelCase<Value, Preserved> {
  return transformKeys(value, snakeToCamelKey, new Set(options.preserveObjectKeys)) as CamelCase<
    Value,
    Preserved
  >;
}

export function toSnakeCase<Value, Preserved extends string = never>(
  value: Value,
  options: CaseConversionOptions<Preserved> = {},
): SnakeCase<Value, Preserved> {
  return transformKeys(value, camelToSnakeKey, new Set(options.preserveObjectKeys)) as SnakeCase<
    Value,
    Preserved
  >;
}
