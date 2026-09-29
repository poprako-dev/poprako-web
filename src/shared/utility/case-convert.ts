export type CaseConversionOptions = {
  preserveObjectKeys?: readonly string[] | undefined;
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

export function toCamelCase(value: unknown, options: CaseConversionOptions = {}): unknown {
  return transformKeys(value, snakeToCamelKey, new Set(options.preserveObjectKeys));
}

export function toSnakeCase(value: unknown, options: CaseConversionOptions = {}): unknown {
  return transformKeys(value, camelToSnakeKey, new Set(options.preserveObjectKeys));
}
