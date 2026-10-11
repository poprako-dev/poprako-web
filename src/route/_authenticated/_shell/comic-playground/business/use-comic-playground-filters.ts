import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/route/_authenticated/_shell/business/comic-list/comic-list";

type ComicPlaygroundFilters = {
  activeStages: number | undefined;
  activeFuzzyTitle: string;
  setActiveFuzzyTitle: Dispatch<SetStateAction<string>>;
  activeUploadStatus: BinaryFilter;
  setActiveUploadStatus: Dispatch<SetStateAction<BinaryFilter>>;
  activeTranslateStatus: TripleFilter;
  setActiveTranslateStatus: Dispatch<SetStateAction<TripleFilter>>;
  activeProofreadStatus: TripleFilter;
  setActiveProofreadStatus: Dispatch<SetStateAction<TripleFilter>>;
  activeTypesetStatus: TripleFilter;
  setActiveTypesetStatus: Dispatch<SetStateAction<TripleFilter>>;
  activeReviewStatus: BinaryFilter;
  setActiveReviewStatus: Dispatch<SetStateAction<BinaryFilter>>;
  activePublishStatus: BinaryFilter;
  setActivePublishStatus: Dispatch<SetStateAction<BinaryFilter>>;
};

function phaseBits(status: BinaryFilter | TripleFilter): 3 | 0 | 1 | 2 {
  if (status === "unset") return 0b11;
  if (status === "pending") return 0b00;
  if (status === "ongoing") return 0b01;
  return 0b10;
}

function stageBits(
  upload: BinaryFilter,
  translate: TripleFilter,
  proofread: TripleFilter,
  typeset: TripleFilter,
  review: BinaryFilter,
  publish: BinaryFilter,
): number | undefined {
  const stages =
    phaseBits(upload) |
    (phaseBits(translate) << 2) |
    (phaseBits(proofread) << 4) |
    (phaseBits(typeset) << 6) |
    (phaseBits(review) << 8) |
    (phaseBits(publish) << 10);

  return stages === 0b1111_1111_1111 ? undefined : stages;
}

export function useComicPlaygroundFilters(): ComicPlaygroundFilters {
  const [activeFuzzyTitle, setActiveFuzzyTitle] = useState<string>("");
  const [activeUploadStatus, setActiveUploadStatus] = useState<BinaryFilter>("unset");
  const [activeTranslateStatus, setActiveTranslateStatus] = useState<TripleFilter>("unset");
  const [activeProofreadStatus, setActiveProofreadStatus] = useState<TripleFilter>("unset");
  const [activeTypesetStatus, setActiveTypesetStatus] = useState<TripleFilter>("unset");
  const [activeReviewStatus, setActiveReviewStatus] = useState<BinaryFilter>("unset");
  const [activePublishStatus, setActivePublishStatus] = useState<BinaryFilter>("unset");

  const activeStages = useMemo(() => {
    return stageBits(
      activeUploadStatus,
      activeTranslateStatus,
      activeProofreadStatus,
      activeTypesetStatus,
      activeReviewStatus,
      activePublishStatus,
    );
  }, [
    activeUploadStatus,
    activeTranslateStatus,
    activeProofreadStatus,
    activeTypesetStatus,
    activeReviewStatus,
    activePublishStatus,
  ]);

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
