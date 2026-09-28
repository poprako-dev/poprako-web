import { useState } from "react";
import type {
  ConfigurableShortcut,
  FixedShortcut,
} from "@/routes/_authenticated/translator/business/shortcut/base-translator-type";

const STORAGE_KEY = "configurableShortcuts";

const fixedShortcuts: FixedShortcut[] = [
  {
    label: "创建框内单元",
    keys: ["左键图片空白处"],
  },
  {
    label: "创建框外单元",
    keys: ["右键图片空白处"],
  },
  {
    label: "聚焦单元",
    keys: ["左键已有单元标记"],
  },
  {
    label: "删除单元",
    keys: ["右键已有单元标记"],
  },
  {
    label: "切换框内外",
    keys: ["左键双击已有标记"],
  },
];

const defaultConfigurableShortcuts: ConfigurableShortcut[] = [
  {
    action: "toggleMode",
    label: "切换模式",
    keys: ["Control", "m"],
  },
  {
    action: "toggleRelocation",
    label: "启用重定位",
    keys: ["Control", "l"],
  },
  {
    action: "toggleProofreadPreview",
    label: "切换标记透明度",
    keys: ["Control", "x"],
  },
  {
    action: "nextMarker",
    label: "下一个标记",
    keys: ["Tab"],
  },
  {
    action: "prevMarker",
    label: "上一个标记",
    keys: ["Shift", "Tab"],
  },
  {
    action: "pageUp",
    label: "上一页",
    keys: ["Control", "u"],
  },
  {
    action: "pageDown",
    label: "下一页",
    keys: ["Control", "d"],
  },
  {
    action: "quickSpecialChar",
    label: "输入最近一次符号",
    keys: ["Control", "q"],
  },
  {
    action: "quickSpecialChar1",
    label: "输入优选符号#1",
    keys: ["Alt", "1"],
  },
  {
    action: "quickSpecialChar2",
    label: "输入优选符号#2",
    keys: ["Alt", "2"],
  },
  {
    action: "quickSpecialChar3",
    label: "输入优选符号#3",
    keys: ["Alt", "3"],
  },
  {
    action: "save",
    label: "保存",
    keys: ["Control", "s"],
  },
];

function migrateStored(raw: unknown): ConfigurableShortcut[] | null {
  if (!Array.isArray(raw)) return null;

  const byAction = new Map(defaultConfigurableShortcuts.map((s) => [s.action, s]));

  const byLabel = new Map(defaultConfigurableShortcuts.map((s) => [s.label, s]));

  const migrated: ConfigurableShortcut[] = [];
  const migratedActions = new Set<ConfigurableShortcut["action"]>();
  let isHadStale = false;

  for (const item of raw) {
    if (!item || typeof item !== "object" || !("keys" in item)) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const rawKeys = record["keys"];
    if (!Array.isArray(rawKeys) || rawKeys.some((key) => typeof key !== "string")) {
      return null;
    }
    const keys: string[] = rawKeys.filter((key): key is string => typeof key === "string");

    const action = typeof record["action"] === "string" ? record["action"] : undefined;
    const fallbackByAction = action
      ? byAction.get(action as ConfigurableShortcut["action"])
      : undefined;
    const fallbackByLabel =
      typeof record["label"] === "string" ? byLabel.get(record["label"]) : undefined;

    const fallback = fallbackByAction ?? fallbackByLabel;
    if (!fallback) {
      isHadStale = true;
      continue;
    }
    if (migratedActions.has(fallback.action)) continue;

    migrated.push({
      action: fallback.action,
      label: fallback.label,
      keys,
    });

    migratedActions.add(fallback.action);
  }

  for (const shortcut of defaultConfigurableShortcuts) {
    if (!migratedActions.has(shortcut.action)) {
      migrated.push(shortcut);
    }
  }

  const orderByAction = new Map(defaultConfigurableShortcuts.map((s, idx) => [s.action, idx]));

  // Keep the migrated array mutable because it is newly allocated above.
  const sorted = migrated.sort(
    (a, b) =>
      (orderByAction.get(a.action) ?? Number.MAX_SAFE_INTEGER) -
      (orderByAction.get(b.action) ?? Number.MAX_SAFE_INTEGER),
  );

  if (isHadStale) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }

  return sorted;
}

export function useShortcuts(): {
  fixedShortcuts: FixedShortcut[];
  configurableShortcuts: ConfigurableShortcut[];
  defaultConfigurableShortcuts: ConfigurableShortcut[];
  updateConfigurableShortcuts: (next: ConfigurableShortcut[]) => void;
} {
  const [configurableShortcuts, setConfigurableShortcuts] = useState<ConfigurableShortcut[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultConfigurableShortcuts;

    try {
      const parsed = JSON.parse(stored) as unknown;
      const migrated = migrateStored(parsed);
      return migrated ?? defaultConfigurableShortcuts;
    } catch {
      return defaultConfigurableShortcuts;
    }
  });

  const updateConfigurableShortcuts = (next: ConfigurableShortcut[]): void => {
    setConfigurableShortcuts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return {
    fixedShortcuts,
    configurableShortcuts,
    defaultConfigurableShortcuts,
    updateConfigurableShortcuts,
  };
}
