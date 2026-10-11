import { useMemo } from "react";
import type { JSX, ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { writePsdUint8Array } from "ag-psd";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ArtworkUploadDialog } from "./ArtworkUploadDialog";

type Props = ComponentProps<typeof ArtworkUploadDialog>;
function PendingUpload(args: Props): JSX.Element {
  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: "/api/v1",
        getAccessToken: () => null,
        fetchImpl: (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                reject(new DOMException("已取消", "AbortError"));
              },
              { once: true },
            );
          }),
      }),
    [],
  );
  const files = useMemo(() => {
    const bytes = writePsdUint8Array({
      width: 1,
      height: 1,
      imageData: new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1),
    });
    return Array.from(
      { length: 33 },
      (_, index) => new File([new Uint8Array(bytes)], String(index + 1).padStart(2, "0") + ".psd"),
    );
  }, []);
  return (
    <ApiProvider client={client}>
      <ArtworkUploadDialog {...args} initialFiles={files} />
    </ApiProvider>
  );
}
const meta = {
  title: "Route/ComicDetail/ArtworkUpload",
  component: ArtworkUploadDialog,
  render: (args) => <PendingUpload {...args} />,
  args: {
    chapterId: "chapter-upload",
    chapterLabel: "第1话",
    onUploaded: fn(),
    onPagesChanged: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ArtworkUploadDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LongBatch: Story = {
  name: "34 项任务 · 内部滚动",
  play: async () => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: "上传" }));
    const list = await body.findByRole("list", { name: "嵌稿上传任务" });
    const scroller = body.getByRole("region", { name: "嵌稿上传进度" });
    await waitFor(() => expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight));
    const dialog = body.getByRole("dialog", { name: "上传嵌稿" });
    const rect = dialog.getBoundingClientRect();
    await expect(rect.top).toBeGreaterThanOrEqual(16);
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight - 16);
    const stop = body.getByRole("button", { name: "停止" });
    await expect(stop.getBoundingClientRect().bottom).toBeLessThan(rect.bottom);
    await waitFor(() => expect(body.getByRole("switch", { name: "打包上传" })).toBeVisible());
    scroller.scrollTop = scroller.scrollHeight;
    await expect(within(list).getByText("33.psd")).toBeVisible();
    await userEvent.click(stop);
    await body.findByRole("button", { name: "重试" });
  },
};
export const MobileLongBatch: Story = {
  ...LongBatch,
  name: "34 项任务 · 手机",
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
