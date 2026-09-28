import { describe, expect, test } from "vitest";

import {
  availableTranslatorModes,
  initialTranslatorMode,
  translatorCompletionStage,
} from "@/routes/_authenticated/translator/business/contract/access";

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
    expect(
      availableTranslatorModes({
        canTranslate: true,
        canProofread: false,
      }),
    ).toEqual(["translate", "readOnly"]);
    expect(
      availableTranslatorModes({
        canTranslate: false,
        canProofread: true,
      }),
    ).toEqual(["proofread", "readOnly"]);
    expect(
      availableTranslatorModes({
        canTranslate: true,
        canProofread: true,
      }),
    ).toEqual(["proofread", "translate", "readOnly"]);
  });

  test("defaults to the highest-priority mode granted by assignments", () => {
    const proofreaderModes = availableTranslatorModes({
      canTranslate: false,
      canProofread: true,
    });
    const translatorModes = availableTranslatorModes({
      canTranslate: true,
      canProofread: false,
    });
    const dualRoleModes = availableTranslatorModes({
      canTranslate: true,
      canProofread: true,
    });

    expect(initialTranslatorMode(proofreaderModes)).toBe("proofread");
    expect(initialTranslatorMode(translatorModes)).toBe("translate");
    expect(initialTranslatorMode(dualRoleModes)).toBe("proofread");
  });

  test("preserves an explicit read-only entry", () => {
    const modes = availableTranslatorModes({
      canTranslate: true,
      canProofread: true,
    });

    expect(initialTranslatorMode(modes, "readOnly")).toBe("readOnly");
  });

  test("completes proofreading before translation when both roles are assigned", () => {
    expect(
      translatorCompletionStage({
        canTranslate: true,
        canProofread: true,
      }),
    ).toBe("proofread");
    expect(
      translatorCompletionStage({
        canTranslate: true,
        canProofread: false,
      }),
    ).toBe("translate");
    expect(
      translatorCompletionStage({
        canTranslate: false,
        canProofread: false,
      }),
    ).toBeUndefined();
  });
});
