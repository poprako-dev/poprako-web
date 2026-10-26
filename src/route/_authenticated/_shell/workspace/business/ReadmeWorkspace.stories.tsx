import { useState } from "react";
import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import type { ComicDetailSearch } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { ReadmeShell } from "@/test-resource/ReadmeShell";
import { prepareReadmeSession } from "@/test-resource/readme-session";
import { Workspace } from "./Workspace";
import { createReadmeWorkspaceClient } from "./readme-workspace-fixture";

const client = createReadmeWorkspaceClient();

function ReadmeWorkspace(): JSX.Element {
  const [search, setSearch] = useState<ComicDetailSearch>({});
  return (
    <ReadmeShell client={client} path="/workspace">
      <Workspace
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

const meta: Meta<typeof ReadmeWorkspace> = {
  title: "README/Workspace",
  component: ReadmeWorkspace,
  parameters: { layout: "fullscreen" },
  beforeEach: prepareReadmeSession,
};

export default meta;
type Story = StoryObj<typeof ReadmeWorkspace>;

export const Filled: Story = {};
