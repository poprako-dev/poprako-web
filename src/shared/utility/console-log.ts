type ConsoleLevel = "debug" | "error" | "info" | "log" | "warn";

type LogEntry = {
  level: ConsoleLevel;
  message: string;
  timestamp: string;
};

const MAX_ENTRY_COUNT = 2000;
const MAX_ENTRY_LENGTH = 16_000;
const MAX_TOTAL_LENGTH = 2_000_000;
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /^(?:access_?token|authorization|password|passwd|refresh_?token|secret)$/i;
const SENSITIVE_TEXT = new RegExp(
  "((?:access_?token|authorization|password|passwd|refresh_?token|secret)" +
    String.raw`\s*[:=]\s*)[^\s,;}]+`,
  "gi",
);
const levels: ConsoleLevel[] = ["debug", "error", "info", "log", "warn"];
const entries: LogEntry[] = [];
const sessionStartedAt = new Date().toISOString();

const collectorState = {
  droppedEntryCount: 0,
  isInstalled: false,
  totalLength: 0,
};

function redactText(value: string): string {
  return value
    .replaceAll(/(bearer\s+)[^\s"',;]+/gi, (_match, prefix: string) => prefix + REDACTED)
    .replaceAll(SENSITIVE_TEXT, (_match, prefix: string) => prefix + REDACTED);
}

function serializeValue(value: unknown): string {
  if (typeof value === "string") {
    return redactText(value);
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }
  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }
  if (typeof value === "symbol") {
    return value.toString();
  }

  if (value instanceof Error) {
    return redactText(value.stack ?? `${value.name}: ${value.message}`);
  }

  if (typeof Element !== "undefined" && value instanceof Element) {
    return redactText(value.outerHTML);
  }

  if (value === null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return redactText(String(value));
  }

  try {
    const seen = new WeakSet();
    const serialized = JSON.stringify(value, function (key, nestedValue: unknown) {
      if (SENSITIVE_KEY.test(key)) {
        return REDACTED;
      }
      if (typeof nestedValue === "bigint") {
        return `${nestedValue.toString()}n`;
      }
      if (typeof nestedValue === "function") {
        return `[Function ${nestedValue.name || "anonymous"}]`;
      }
      if (typeof nestedValue === "symbol") {
        return nestedValue.toString();
      }
      if (nestedValue instanceof Error) {
        return {
          name: nestedValue.name,
          message: nestedValue.message,
          stack: nestedValue.stack,
        };
      }
      if (nestedValue && typeof nestedValue === "object") {
        if (seen.has(nestedValue)) {
          return "[Circular]";
        }
        seen.add(nestedValue);
      }
      return nestedValue;
    });

    return redactText(serialized);
  } catch {
    return "[Unserializable value]";
  }
}

function addEntry(level: ConsoleLevel, values: unknown[]): void {
  let message: string;
  try {
    message = values.map((value) => serializeValue(value)).join(" ");
  } catch {
    message = "[Failed to capture console arguments]";
  }

  if (message.length > MAX_ENTRY_LENGTH) {
    message = `${message.slice(0, MAX_ENTRY_LENGTH)}\n[Entry truncated]`;
  }

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  entries.push(entry);
  collectorState.totalLength += entry.message.length;

  while (entries.length > MAX_ENTRY_COUNT || collectorState.totalLength > MAX_TOTAL_LENGTH) {
    const removed = entries.shift();
    if (!removed) {
      break;
    }
    collectorState.totalLength -= removed.message.length;
    collectorState.droppedEntryCount += 1;
  }
}

export function installConsoleLogCollector(): void {
  if (collectorState.isInstalled) {
    return;
  }
  collectorState.isInstalled = true;

  for (const level of levels) {
    const original = console[level].bind(console); // eslint-disable-line no-console
    // eslint-disable-next-line no-console -- wrapped to record diagnostics before forwarding.
    console[level] = (...values: unknown[]) => {
      addEntry(level, values);
      original(...values);
    };
  }

  addEventListener("error", (event) => {
    addEntry("error", [
      "[Uncaught error]",
      event.error ?? event.message,
      `${event.filename}:${String(event.lineno)}:${String(event.colno)}`,
    ]);
  });

  addEventListener("unhandledrejection", (event) => {
    addEntry("error", ["[Unhandled promise rejection]", event.reason]);
  });
}

function createExportText(): string {
  const header = [
    "PopRaKo W diagnostic log",
    `Session started: ${sessionStartedAt}`,
    `Exported: ${new Date().toISOString()}`,
    `Page: ${redactText(location.href)}`,
    `User agent: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Viewport: ${String(window.innerWidth)}x${String(window.innerHeight)}`,
    `Online: ${String(navigator.onLine)}`,
    `Captured entries: ${String(entries.length)}`,
    `Dropped entries: ${String(collectorState.droppedEntryCount)}`,
    "Sensitive fields are automatically redacted where detectable.",
    "",
    "--- Logs ---",
  ];
  const body = entries.map(
    (entry) => `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}`,
  );
  return [...header, ...body, ""].join("\n");
}

export function downloadConsoleLogs(): number {
  const content = createExportText();
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");

  anchor.href = url;
  anchor.download = `poprako-web-log-${timestamp}.log`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);

  return entries.length;
}
