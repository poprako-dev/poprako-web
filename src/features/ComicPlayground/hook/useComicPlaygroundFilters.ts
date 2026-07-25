import { useMemo, useState } from "react";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";

function phaseBits(status: BinaryFilter | TripleFilter) {
  if (status === "unset") return 0b11;
  if (status === "pending") return 0b00;
  if (status === "ongoing") return 0b01;
  return 0b10;
}

export function useComicPlaygroundFilters() {
  const [activeFuzzyTitle, setActiveFuzzyTitle] = useState<string>("");
  const [activeUploadStatus, setActiveUploadStatus] =
    useState<BinaryFilter>("unset");
  const [activeTranslateStatus, setActiveTranslateStatus] =
    useState<TripleFilter>("unset");
  const [activeProofreadStatus, setActiveProofreadStatus] =
    useState<TripleFilter>("unset");
  const [activeTypesetStatus, setActiveTypesetStatus] =
    useState<TripleFilter>("unset");
  const [activeReviewStatus, setActiveReviewStatus] =
    useState<BinaryFilter>("unset");
  const [activePublishStatus, setActivePublishStatus] =
    useState<BinaryFilter>("unset");

  const activeStages = useMemo(
    () => {
      const stages =
        phaseBits(activeUploadStatus) |
        (phaseBits(activeTranslateStatus) << 2) |
        (phaseBits(activeProofreadStatus) << 4) |
        (phaseBits(activeTypesetStatus) << 6) |
        (phaseBits(activeReviewStatus) << 8) |
        (phaseBits(activePublishStatus) << 10);

      return stages === 0b111111111111 ? undefined : stages;
    },
    [
      activeUploadStatus,
      activeTranslateStatus,
      activeProofreadStatus,
      activeTypesetStatus,
      activeReviewStatus,
      activePublishStatus,
    ],
  );

  return {
    activeStages,
    activeFuzzyTitle,
    setActiveFuzzyTitle,
    activeUploadStatus,
    setActiveUploadStatus,
    activeTranslateStatus,
    setActiveTranslateStatus,
    activeProofreadStatus,
    setActiveProofreadStatus,
    activeTypesetStatus,
    setActiveTypesetStatus,
    activeReviewStatus,
    setActiveReviewStatus,
    activePublishStatus,
    setActivePublishStatus,
  };
}
