type ConsoleLevel = "debug" | "error" | "info" | "log" | "warn";

type LogEntry = {
  level: ConsoleLevel;
  message: string;
  timestamp: string;
};

const MAX_ENTRY_COUNT = 2_000;
const MAX_ENTRY_LENGTH = 16_000;
const MAX_TOTAL_LENGTH = 2_000_000;
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /^(?:access_?token|authorization|password|passwd|refresh_?token|secret)$/i;
const SENSITIVE_TEXT = new RegExp(
  "((?:access_?token|authorization|password|passwd|refresh_?token|secret)" +
    "\\s*[:=]\\s*)[^\\s,;}]+",
  "gi",
);
const levels: ConsoleLevel[] = ["debug", "error", "info", "log", "warn"];
const entries: LogEntry[] = [];
const sessionStartedAt = new Date().toISOString();

let droppedEntryCount = 0;
let installed = false;
let totalLength = 0;

function redactText(value: string) {
  return value
    .replace(/(bearer\s+)[^\s"',;]+/gi, `$1${REDACTED}`)
    .replace(SENSITIVE_TEXT, `$1${REDACTED}`);
}

function serializeValue(value: unknown) {
  if (typeof value === "string") return redactText(value);
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();

  if (value instanceof Error) {
    return redactText(value.stack ?? `${value.name}: ${value.message}`);
  }

  if (value instanceof Element) {
    return redactText(value.outerHTML);
  }

  if (value === null || typeof value !== "object") {
    return redactText(String(value));
  }

  try {
    const seen = new WeakSet<object>();
    const serialized = JSON.stringify(value, function (key, nestedValue: unknown) {
      if (SENSITIVE_KEY.test(key)) return REDACTED;
      if (typeof nestedValue === "bigint") return `${nestedValue.toString()}n`;
      if (typeof nestedValue === "function") {
        return `[Function ${nestedValue.name || "anonymous"}]`;
      }
      if (typeof nestedValue === "symbol") return nestedValue.toString();
      if (nestedValue instanceof Error) {
        return {
          name: nestedValue.name,
          message: nestedValue.message,
          stack: nestedValue.stack,
        };
      }
      if (nestedValue && typeof nestedValue === "object") {
        if (seen.has(nestedValue)) return "[Circular]";
        seen.add(nestedValue);
      }
      return nestedValue;
    });

    return redactText(serialized ?? String(value));
  } catch {
    try {
      return redactText(String(value));
    } catch {
      return "[Unserializable value]";
    }
  }
}

function addEntry(level: ConsoleLevel, values: unknown[]) {
  let message: string;
  try {
    message = values.map(serializeValue).join(" ");
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
  totalLength += entry.message.length;

  while (entries.length > MAX_ENTRY_COUNT || totalLength > MAX_TOTAL_LENGTH) {
    const removed = entries.shift();
    if (!removed) break;
    totalLength -= removed.message.length;
    droppedEntryCount += 1;
  }
}

function installConsoleLogCollector() {
  if (installed) return;
  installed = true;

  levels.forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...values: unknown[]) => {
      addEntry(level, values);
      original(...values);
    };
  });

  window.addEventListener("error", (event) => {
    addEntry("error", [
      "[Uncaught error]",
      event.error ?? event.message,
      `${event.filename}:${event.lineno}:${event.colno}`,
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    addEntry("error", ["[Unhandled promise rejection]", event.reason]);
  });
}

function createExportText() {
  const header = [
    "PopRaKo W diagnostic log",
    `Session started: ${sessionStartedAt}`,
    `Exported: ${new Date().toISOString()}`,
    `Page: ${redactText(window.location.href)}`,
    `User agent: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight}`,
    `Online: ${navigator.onLine}`,
    `Captured entries: ${entries.length}`,
    `Dropped entries: ${droppedEntryCount}`,
    "Sensitive fields are automatically redacted where detectable.",
    "",
    "--- Logs ---",
  ];
  const body = entries.map(
    (entry) => `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}`,
  );
  return [...header, ...body, ""].join("\n");
}

export function downloadConsoleLogs() {
  const content = createExportText();
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  anchor.href = url;
  anchor.download = `poprako-w-log-${timestamp}.log`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  return entries.length;
}

installConsoleLogCollector();
