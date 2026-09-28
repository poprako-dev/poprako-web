import { type JSX, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ComicList } from "@/routes/_authenticated/_shell/comic-playground/business/comic-list/ComicList";
import type { ComicInfo } from "@/routes/_authenticated/business/comic/comic";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/routes/_authenticated/_shell/business/comic-list/comic-list";

const now = Date.now();

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("示例数据缺失");
  return value;
}

// ── Mock Builders ─────────────────────────────────

function makeMockComic(idx: number): ComicInfo {
  return {
    id: `comic-${String(idx)}`,
    worksetId: "ws-1",
    title: `测试漫画 ${String(idx + 1)}`,
    author: `作者 ${String(idx + 1)}`,
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
    createdAt: now - 86_400_000 * 30,
    updatedAt: now - 86_400_000,
  },
  {
    id: "ws-2",
    teamId: "team-1",
    index: 1,
    name: "Team Shared",
    description: "团队共享",
    comicCount: 45,
    createdAt: now - 86_400_000 * 20,
    updatedAt: now - 86_400_000 * 2,
  },
  {
    id: "ws-3",
    teamId: "team-1",
    index: 2,
    name: "Archive 2024",
    description: "2024年归档",
    comicCount: 890,
    createdAt: now - 86_400_000 * 10,
    updatedAt: now - 86_400_000 * 3,
  },
  {
    id: "ws-4",
    teamId: "team-1",
    index: 3,
    name: "Public Library",
    description: "公共库",
    comicCount: 12,
    createdAt: now - 86_400_000 * 5,
    updatedAt: now - 3_600_000,
  },
];

const FULL_COMICS = Array.from({ length: 20 }, (_, i) => makeMockComic(i));

function makePagedLoader(allComics: ComicInfo[], delay = 800) {
  return async (offset: number, limit: number): Promise<Result<ComicInfo[]>> => {
    await new Promise((r) => setTimeout(r, delay));
    return { success: true, data: allComics.slice(offset, offset + limit) };
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

type InteractiveComicListProps = {
  canCreateComic?: boolean | undefined;
};

function InteractiveComicList({ canCreateComic = true }: InteractiveComicListProps): JSX.Element {
  const [worksets, setWorksets] = useState(mockWorksets);
  const [activeWsId, setActiveWsId] = useState("ws-1");
  const [title, setTitle] = useState("");
  const [upload, setUpload] = useState<BinaryFilter>("unset");
  const [translate, setTranslate] = useState<TripleFilter>("unset");
  const [proofread, setProofread] = useState<TripleFilter>("unset");
  const [typeset, setTypeset] = useState<TripleFilter>("unset");
  const [review, setReview] = useState<BinaryFilter>("unset");
  const [publish, setPublish] = useState<BinaryFilter>("unset");

  const handleCreateWorkset = (): void => {
    const id = `ws-${String(Date.now())}`;
    const ws: WorksetInfo = {
      id,
      teamId: "team-1",
      index: worksets.length,
      name: `新工作区 ${String(worksets.length + 1)}`,
      description: "",
      comicCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setWorksets((prev) => [ws, ...prev]);
    setActiveWsId(id);
  };

  return (
    <div className="h-screen w-full">
      <ComicList
        worksets={worksets}
        activeWorksetId={activeWsId}
        onChangeWorkset={(id) => {
          setActiveWsId(id);
        }}
        onCreateWorkset={handleCreateWorkset}
        onLoadComics={makePagedLoader(FULL_COMICS, 400)}
        onComicClick={() => {
          return;
        }}
        onCreateComic={
          canCreateComic
            ? () => {
                return;
              }
            : undefined
        }
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
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "创建漫画" })).toBeVisible();
  },
};

export const NonAdmin: Story = {
  name: "非管理员",
  render: () => <InteractiveComicList canCreateComic={false} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button", { name: "创建漫画" })).toBeNull();
  },
};

// ── Reviewer Mode ─────────────────────────────────

function ReviewerComicList(): JSX.Element {
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
        onChangeWorkset={(id) => {
          setActiveWsId(id);
        }}
        onCreateWorkset={() => {
          return;
        }}
        onLoadComics={makePagedLoader(FULL_COMICS)}
        onComicClick={() => {
          return;
        }}
        onCreateComic={() => {
          return;
        }}
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

function EmptyComicList(): JSX.Element {
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
        onChangeWorkset={() => {
          return;
        }}
        onCreateWorkset={() => {
          return;
        }}
        onLoadComics={() => Promise.resolve({ success: true, data: [] })}
        onCreateComic={() => {
          return;
        }}
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

export const EmptyState: Story = {
  name: "空数据",
  render: () => <EmptyComicList />,
};

// ── Single Workset ────────────────────────────────

function SingleWorksetComicList(): JSX.Element {
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
        worksets={[required(mockWorksets[0])]}
        activeWorksetId="ws-1"
        onChangeWorkset={() => {
          return;
        }}
        onCreateWorkset={() => {
          return;
        }}
        onLoadComics={makePagedLoader(FULL_COMICS.slice(0, 5), 400)}
        onCreateComic={() => {
          return;
        }}
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

export const SingleWorkset: Story = {
  name: "单个工作区",
  render: () => <SingleWorksetComicList />,
};
