import { describe, expect, test } from "vitest";

import {
  availableTranslatorModes,
  initialTranslatorMode,
  nextTranslatorMode,
} from "./access";

describe("translator assignment access", () => {
  test("makes users without a translation assignment read-only", () => {
    const modes = availableTranslatorModes({
      canTranslate: false,
      canProofread: false,
    });

    expect(modes).toEqual(["readOnly"]);
    expect(initialTranslatorMode(modes)).toBe("readOnly");
  });

  test("limits users to the modes granted by their assignment", () => {
    expect(availableTranslatorModes({
      canTranslate: true,
      canProofread: false,
    })).toEqual(["translate"]);
    expect(availableTranslatorModes({
      canTranslate: false,
      canProofread: true,
    })).toEqual(["proofread"]);
    expect(availableTranslatorModes({
      canTranslate: true,
      canProofread: true,
    })).toEqual(["translate", "proofread"]);
  });

  test("does not let a requested mode expand granted permissions", () => {
    const modes = availableTranslatorModes({
      canTranslate: false,
      canProofread: true,
    });

    expect(initialTranslatorMode(modes, "translate")).toBe("proofread");
    expect(initialTranslatorMode(modes, "readOnly")).toBe("readOnly");
  });

  test("cycles only through modes granted by the assignment", () => {
    const modes = availableTranslatorModes({
      canTranslate: true,
      canProofread: true,
    });

    expect(nextTranslatorMode("translate", modes)).toBe("proofread");
    expect(nextTranslatorMode("proofread", modes)).toBe("translate");
  });
});
