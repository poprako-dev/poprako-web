import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicList from "@/features/ComcList/components/business/ComicList";
import type { ComicInfo } from "@/types/comic";
import type { WorksetInfo } from "@/types/workset";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";

const now = Date.now();

// ── Mock Builders ─────────────────────────────────

function makeMockComic(idx: number): ComicInfo {
  return {
    id: `comic-${idx}`,
    worksetId: "ws-1",
    title: `测试漫画 ${idx + 1}`,
    author: `作者 ${idx + 1}`,
    description: "这是一部测试用的漫画",
    index: idx,
    chapterCount: 10 + idx,
    creatorId: "user-0",
    coverUrl: "",
    isCoverUploaded: false,
    lastActiveAt: now - 1000 * 60 * 60 * idx,
    createdAt: now,
    updatedAt: now,
  };
}

const mockWorksets: WorksetInfo[] = [
  {
    id: "ws-1",
    teamId: "team-1",
    index: 0,
    name: "Personal Collection",
    description: "个人收藏",
    comicCount: 124,
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  },
  {
    id: "ws-2",
    teamId: "team-1",
    index: 1,
    name: "Team Shared",
    description: "团队共享",
    comicCount: 45,
    createdAt: now - 86400000 * 20,
    updatedAt: now - 86400000 * 2,
  },
  {
    id: "ws-3",
    teamId: "team-1",
    index: 2,
    name: "Archive 2024",
    description: "2024年归档",
    comicCount: 890,
    createdAt: now - 86400000 * 10,
    updatedAt: now - 86400000 * 3,
  },
  {
    id: "ws-4",
    teamId: "team-1",
    index: 3,
    name: "Public Library",
    description: "公共库",
    comicCount: 12,
    createdAt: now - 86400000 * 5,
    updatedAt: now - 3600000,
  },
];

const FULL_COMICS = Array.from({ length: 20 }, (_, i) => makeMockComic(i));

function makePagedLoader(allComics: ComicInfo[], delay = 800) {
  return async (
    offset: number,
    limit: number,
  ): Promise<ComicInfo[] | string> => {
    await new Promise((r) => setTimeout(r, delay));
    return allComics.slice(offset, offset + limit);
  };
}

// ── Meta ──────────────────────────────────────────

const meta: Meta<typeof ComicList> = {
  title: "Features/ComcList/ComicList",
  component: ComicList,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ComicList>;

// ── Interactive (full-featured) ───────────────────

function InteractiveComicList() {
  const [worksets, setWorksets] = useState(mockWorksets);
  const [activeWsId, setActiveWsId] = useState("ws-1");
  const [title, setTitle] = useState("");
  const [upload, setUpload] = useState<BinaryFilter>("unset");
  const [translate, setTranslate] = useState<TripleFilter>("unset");
  const [proofread, setProofread] = useState<TripleFilter>("unset");
  const [typeset, setTypeset] = useState<TripleFilter>("unset");
  const [review, setReview] = useState<BinaryFilter>("unset");
  const [publish, setPublish] = useState<BinaryFilter>("unset");

  const handleCreateWorkset = () => {
    const id = `ws-${Date.now()}`;
    const ws: WorksetInfo = {
      id,
      teamId: "team-1",
      index: worksets.length,
      name: `新工作区 ${worksets.length + 1}`,
      description: "",
      comicCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setWorksets((prev) => [ws, ...prev]);
    setActiveWsId(id);
  };

  const handleDeleteWorkset = (wsId: string) => {
    setWorksets((prev) => prev.filter((ws) => ws.id !== wsId));
    if (activeWsId === wsId && worksets.length > 1) {
      const next = worksets.find((ws) => ws.id !== wsId);
      if (next) setActiveWsId(next.id);
    }
  };
  return (
    <div className="h-screen w-full">
      <ComicList
        worksets={worksets}
        activeWorksetId={activeWsId}
        onChangeWorkset={(id) => setActiveWsId(id)}
        onCreateWorkset={handleCreateWorkset}
        onDeleteWorkset={handleDeleteWorkset}
        onLoadComics={makePagedLoader(FULL_COMICS, 400)}
        onComicClick={(c) => console.log("click comic:", c.title)}
        onCreateComic={() => console.log("create comic")}
        activeFuzzyTitle={title}
        onChangeFuzzyTitle={setTitle}
        activeUploadStatus={upload}
        activeTranslateStatus={translate}
        activeProofreadStatus={proofread}
        activeTypesetStatus={typeset}
        activeReviewStatus={review}
        activePublishStatus={publish}
        onChangeUploadStatus={setUpload}
        onChangeTranslateStatus={setTranslate}
        onChangeProofreadStatus={setProofread}
        onChangeTypesetStatus={setTypeset}
        onChangeReviewStatus={setReview}
        onChangePublishStatus={setPublish}
      />
    </div>
  );
}

export const Interactive: Story = {
  name: "交互式 (完整功能)",
  render: () => <InteractiveComicList />,
};

// ── Reviewer Mode ─────────────────────────────────

function ReviewerComicList() {
  const [activeWsId, setActiveWsId] = useState("ws-1");
  const [title, setTitle] = useState("");
  const [upload, setUpload] = useState<BinaryFilter>("unset");
  const [translate, setTranslate] = useState<TripleFilter>("unset");
  const [proofread, setProofread] = useState<TripleFilter>("unset");
  const [typeset, setTypeset] = useState<TripleFilter>("unset");
  const [review, setReview] = useState<BinaryFilter>("unset");
  const [publish, setPublish] = useState<BinaryFilter>("unset");

  return (
    <div className="h-screen w-full">
      <ComicList
        initialMode="reviewer"
        worksets={mockWorksets}
        activeWorksetId={activeWsId}
        onChangeWorkset={(id) => setActiveWsId(id)}
        onCreateWorkset={() => console.log("create workset")}
        onDeleteWorkset={(id) => console.log("delete:", id)}
        onLoadComics={makePagedLoader(FULL_COMICS)}
        onComicClick={(c) => console.log("click:", c.title)}
        onCreateComic={() => console.log("create comic")}
        activeFuzzyTitle={title}
        onChangeFuzzyTitle={setTitle}
        activeUploadStatus={upload}
        activeTranslateStatus={translate}
        activeProofreadStatus={proofread}
        activeTypesetStatus={typeset}
        activeReviewStatus={review}
        activePublishStatus={publish}
        onChangeUploadStatus={setUpload}
        onChangeTranslateStatus={setTranslate}
        onChangeProofreadStatus={setProofread}
        onChangeTypesetStatus={setTypeset}
        onChangeReviewStatus={setReview}
        onChangePublishStatus={setPublish}
      />
    </div>
  );
}

export const ReviewerMode: Story = {
  name: "审阅者模式",
  render: () => <ReviewerComicList />,
};

// ── Empty State ───────────────────────────────────

export const EmptyState: Story = {
  name: "空数据",
  render: () => {
    const [title, setTitle] = useState("");
    const [upload, setUpload] = useState<BinaryFilter>("unset");
    const [translate, setTranslate] = useState<TripleFilter>("unset");
    const [proofread, setProofread] = useState<TripleFilter>("unset");
    const [typeset, setTypeset] = useState<TripleFilter>("unset");
    const [review, setReview] = useState<BinaryFilter>("unset");
    const [publish, setPublish] = useState<BinaryFilter>("unset");

    return (
      <div className="h-screen w-full">
        <ComicList
          worksets={mockWorksets}
          activeWorksetId="ws-1"
          onChangeWorkset={() => {}}
          onCreateWorkset={() => {}}
          onDeleteWorkset={() => {}}
          onLoadComics={async () => []}
          onCreateComic={() => {}}
          activeFuzzyTitle={title}
          onChangeFuzzyTitle={setTitle}
          activeUploadStatus={upload}
          activeTranslateStatus={translate}
          activeProofreadStatus={proofread}
          activeTypesetStatus={typeset}
          activeReviewStatus={review}
          activePublishStatus={publish}
          onChangeUploadStatus={setUpload}
          onChangeTranslateStatus={setTranslate}
          onChangeProofreadStatus={setProofread}
          onChangeTypesetStatus={setTypeset}
          onChangeReviewStatus={setReview}
          onChangePublishStatus={setPublish}
        />
      </div>
    );
  },
};

// ── Single Workset ────────────────────────────────

export const SingleWorkset: Story = {
  name: "单个工作区",
  render: () => {
    const [title, setTitle] = useState("");
    const [upload, setUpload] = useState<BinaryFilter>("unset");
    const [translate, setTranslate] = useState<TripleFilter>("unset");
    const [proofread, setProofread] = useState<TripleFilter>("unset");
    const [typeset, setTypeset] = useState<TripleFilter>("unset");
    const [review, setReview] = useState<BinaryFilter>("unset");
    const [publish, setPublish] = useState<BinaryFilter>("unset");

    return (
      <div className="h-screen w-full">
        <ComicList
          worksets={[mockWorksets[0]]}
          activeWorksetId="ws-1"
          onChangeWorkset={() => {}}
          onCreateWorkset={() => console.log("create workset")}
          onDeleteWorkset={() => {}}
          onLoadComics={makePagedLoader(FULL_COMICS.slice(0, 5), 400)}
          onCreateComic={() => console.log("create comic")}
          activeFuzzyTitle={title}
          onChangeFuzzyTitle={setTitle}
          activeUploadStatus={upload}
          activeTranslateStatus={translate}
          activeProofreadStatus={proofread}
          activeTypesetStatus={typeset}
          activeReviewStatus={review}
          activePublishStatus={publish}
          onChangeUploadStatus={setUpload}
          onChangeTranslateStatus={setTranslate}
          onChangeProofreadStatus={setProofread}
          onChangeTypesetStatus={setTypeset}
          onChangeReviewStatus={setReview}
          onChangePublishStatus={setPublish}
        />
      </div>
    );
  },
};
