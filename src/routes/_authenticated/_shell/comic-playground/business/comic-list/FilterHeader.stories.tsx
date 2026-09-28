import { type JSX, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterHeader } from "@/routes/_authenticated/_shell/comic-playground/business/comic-list/FilterHeader";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/routes/_authenticated/_shell/business/comic-list/comic-list";

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

function InteractiveFilterHeader(): JSX.Element {
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
        }}
        activeUploadStatus={upload}
        activeTranslateStatus={translate}
        activeProofreadStatus={proofread}
        activeTypesetStatus={typeset}
        activeReviewStatus={review}
        activePublishStatus={publish}
        onChangeUploadStatus={(next) => {
          setUpload(next);
        }}
        onChangeTranslateStatus={(next) => {
          setTranslate(next);
        }}
        onChangeProofreadStatus={(next) => {
          setProofread(next);
        }}
        onChangeTypesetStatus={(next) => {
          setTypeset(next);
        }}
        onChangeReviewStatus={(next) => {
          setReview(next);
        }}
        onChangePublishStatus={(next) => {
          setPublish(next);
        }}
        onCreateComic={() => {
          return;
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
        onChangeFuzzyTitle={() => {
          return;
        }}
        activeUploadStatus="completed"
        activeTranslateStatus="completed"
        activeProofreadStatus="ongoing"
        activeTypesetStatus="pending"
        activeReviewStatus="completed"
        activePublishStatus="pending"
        onChangeUploadStatus={() => {
          return;
        }}
        onChangeTranslateStatus={() => {
          return;
        }}
        onChangeProofreadStatus={() => {
          return;
        }}
        onChangeTypesetStatus={() => {
          return;
        }}
        onChangeReviewStatus={() => {
          return;
        }}
        onChangePublishStatus={() => {
          return;
        }}
        onCreateComic={() => {
          return;
        }}
      />
    </div>
  ),
};
