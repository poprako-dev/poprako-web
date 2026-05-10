import { useState } from "react";
import type {
  ConfigurableShortcut,
  FixedShortcut,
} from "@/features/BaseTranslator/features/ShortcutPanel";

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
];

const defaultConfigurableShortcuts: ConfigurableShortcut[] = [
  {
    action: "toggleMode",
    label: "切换翻校模式",
    keys: ["Control", "m"],
  },
  {
    action: "toggleRelocation",
    label: "启用重定位",
    keys: ["Control", "l"],
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
];

function migrateStored(raw: unknown): ConfigurableShortcut[] | null {
  if (!Array.isArray(raw)) return null;

  const byLabel = new Map(
    defaultConfigurableShortcuts.map((s) => [s.label, s]),
  );

  const migrated: ConfigurableShortcut[] = [];
  for (const item of raw) {
    if (
      !item ||
      typeof item !== "object" ||
      !("label" in item) ||
      !("keys" in item)
    ) {
      return null;
    }

    const fallback = byLabel.get(item.label as string);
    if (!fallback) continue;

    migrated.push({
      action: fallback.action,
      label: fallback.label,
      keys: item.keys as string[],
    });
  }

  if (migrated.length !== defaultConfigurableShortcuts.length) {
    return null;
  }

  return migrated;
}

export function useShortcuts() {
  const [configurableShortcuts, setConfigurableShortcuts] = useState<
    ConfigurableShortcut[]
  >(() => {
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

  const updateConfigurableShortcuts = (next: ConfigurableShortcut[]) => {
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
