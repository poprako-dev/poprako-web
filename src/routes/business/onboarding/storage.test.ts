import { describe, expect, it, vi } from "vitest";
import {
  FIRST_REGISTRATION_FLAG_KEY,
  readFirstRegistrationFlag,
  writeFirstRegistrationFlag,
} from "@/routes/business/onboarding/storage";

function memoryStorage(initialValue: string | null = null): Pick<Storage, "getItem" | "setItem"> {
  let value = initialValue;

  return {
    getItem: (key: string) => (key === FIRST_REGISTRATION_FLAG_KEY ? value : null),
    setItem: (key: string, nextValue: string) => {
      if (key === FIRST_REGISTRATION_FLAG_KEY) value = nextValue;
    },
  };
}

describe("first registration flag", () => {
  it("defaults to false for users who registered before the flag existed", () => {
    expect(readFirstRegistrationFlag(memoryStorage())).toBe(false);
  });

  it("returns true only after registration guidance has been handled", () => {
    expect(readFirstRegistrationFlag(memoryStorage("false"))).toBe(false);
    expect(readFirstRegistrationFlag(memoryStorage("true"))).toBe(true);
    expect(readFirstRegistrationFlag(memoryStorage("invalid"))).toBe(false);
  });

  it("persists the boolean value", () => {
    const storage = memoryStorage();

    writeFirstRegistrationFlag(false, storage);
    expect(readFirstRegistrationFlag(storage)).toBe(false);

    writeFirstRegistrationFlag(true, storage);
    expect(readFirstRegistrationFlag(storage)).toBe(true);
  });

  it("does not break registration when browser storage is unavailable", () => {
    const error = new Error("storage unavailable");
    const storage = {
      getItem: () => {
        throw error;
      },
      setItem: () => {
        throw error;
      },
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
      // Keep the test output silent while preserving the spy calls.
    });

    expect(readFirstRegistrationFlag(storage)).toBe(false);
    expect(() => {
      writeFirstRegistrationFlag(false, storage);
    }).not.toThrow();
    expect(consoleError).toHaveBeenCalledTimes(2);

    consoleError.mockRestore();
  });
});
