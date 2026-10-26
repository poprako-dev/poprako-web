import { useState } from "react";
import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import type { ComicDetailSearch } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { ReadmeShell } from "@/test-resource/ReadmeShell";
import { prepareReadmeSession } from "@/test-resource/readme-session";
import { ComicPlayground } from "./ComicPlayground";
import { createReadmePlaygroundClient } from "./readme-playground-fixture";

const client = createReadmePlaygroundClient();

function ReadmeComicPlayground(): JSX.Element {
  const [search, setSearch] = useState<ComicDetailSearch>({});
  return (
    <ReadmeShell client={client} path="/comic-playground">
      <ComicPlayground
        search={search}
        onChangeSearch={(comicId, chapterId, detailMode) => {
          setSearch({
            comicId: comicId ?? undefined,
            chapterId: chapterId ?? undefined,
            detailMode,
          });
        }}
        onNavigateToWorkbench={fn()}
      />
    </ReadmeShell>
  );
}

const meta: Meta<typeof ReadmeComicPlayground> = {
  title: "README/ComicPlayground",
  component: ReadmeComicPlayground,
  parameters: { layout: "fullscreen" },
  beforeEach: prepareReadmeSession,
};

export default meta;
type Story = StoryObj<typeof ReadmeComicPlayground>;

export const Filled: Story = {};
