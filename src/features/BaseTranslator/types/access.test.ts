import { describe, expect, test } from "vitest";

import {
  availableTranslatorModes,
  initialTranslatorMode,
  translatorCompletionStage,
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
    })).toEqual(["proofread"]);
  });

  test("locks the mode selected at entry and prioritizes proofreading", () => {
    const modes = availableTranslatorModes({
      canTranslate: false,
      canProofread: true,
    });

    expect(initialTranslatorMode(modes, "translate")).toBe("proofread");
    expect(initialTranslatorMode(modes, "readOnly")).toBe("readOnly");
  });

  test("completes proofreading before translation when both roles are assigned", () => {
    expect(translatorCompletionStage({
      canTranslate: true,
      canProofread: true,
    })).toBe("proofread");
    expect(translatorCompletionStage({
      canTranslate: true,
      canProofread: false,
    })).toBe("translate");
    expect(translatorCompletionStage({
      canTranslate: false,
      canProofread: false,
    })).toBeUndefined();
  });
});
