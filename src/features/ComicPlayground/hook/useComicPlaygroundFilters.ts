import { useMemo, useState } from "react";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";
import type { ComicClientFilters } from "../types/comic";

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

  const comicFilters = useMemo<ComicClientFilters>(
    () => ({
      fuzzyTitle: activeFuzzyTitle,
      uploadStatus: activeUploadStatus,
      translateStatus: activeTranslateStatus,
      proofreadStatus: activeProofreadStatus,
      typesetStatus: activeTypesetStatus,
      reviewStatus: activeReviewStatus,
      publishStatus: activePublishStatus,
    }),
    [
      activeFuzzyTitle,
      activeUploadStatus,
      activeTranslateStatus,
      activeProofreadStatus,
      activeTypesetStatus,
      activeReviewStatus,
      activePublishStatus,
    ],
  );

  return {
    comicFilters,
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
