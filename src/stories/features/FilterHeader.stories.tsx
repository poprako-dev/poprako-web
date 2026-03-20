import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FilterHeader from "@/features/ComcList/components/business/FilterHeader";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";

const meta: Meta<typeof FilterHeader> = {
  title: "Features/ComcList/FilterHeader",
  component: FilterHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FilterHeader>;

function InteractiveFilterHeader() {
  const [title, setTitle] = useState("");
  const [upload, setUpload] = useState<BinaryFilter>("unset");
  const [translate, setTranslate] = useState<TripleFilter>("unset");
  const [proofread, setProofread] = useState<TripleFilter>("unset");
  const [typeset, setTypeset] = useState<TripleFilter>("unset");
  const [review, setReview] = useState<BinaryFilter>("unset");
  const [publish, setPublish] = useState<BinaryFilter>("unset");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <FilterHeader
        activeFuzzyTitle={title}
        onChangeFuzzyTitle={(next) => {
          setTitle(next);
          console.log("fuzzy title:", next);
        }}
        activeUploadStatus={upload}
        activeTranslateStatus={translate}
        activeProofreadStatus={proofread}
        activeTypesetStatus={typeset}
        activeReviewStatus={review}
        activePublishStatus={publish}
        onChangeUploadStatus={(next) => {
          setUpload(next);
          console.log("upload:", next);
        }}
        onChangeTranslateStatus={(next) => {
          setTranslate(next);
          console.log("translate:", next);
        }}
        onChangeProofreadStatus={(next) => {
          setProofread(next);
          console.log("proofread:", next);
        }}
        onChangeTypesetStatus={(next) => {
          setTypeset(next);
          console.log("typeset:", next);
        }}
        onChangeReviewStatus={(next) => {
          setReview(next);
          console.log("review:", next);
        }}
        onChangePublishStatus={(next) => {
          setPublish(next);
          console.log("publish:", next);
        }}
        onCreateComic={() => {
          console.log("create comic");
        }}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveFilterHeader />,
};

export const PresetCompleted: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-5xl">
      <FilterHeader
        activeFuzzyTitle="小森林物语"
        onChangeFuzzyTitle={(next) => console.log("fuzzy title:", next)}
        activeUploadStatus="completed"
        activeTranslateStatus="completed"
        activeProofreadStatus="in_progress"
        activeTypesetStatus="pending"
        activeReviewStatus="completed"
        activePublishStatus="pending"
        onChangeUploadStatus={(next) => console.log("upload:", next)}
        onChangeTranslateStatus={(next) => console.log("translate:", next)}
        onChangeProofreadStatus={(next) => console.log("proofread:", next)}
        onChangeTypesetStatus={(next) => console.log("typeset:", next)}
        onChangeReviewStatus={(next) => console.log("review:", next)}
        onChangePublishStatus={(next) => console.log("publish:", next)}
        onCreateComic={() => console.log("create comic")}
      />
    </div>
  ),
};
