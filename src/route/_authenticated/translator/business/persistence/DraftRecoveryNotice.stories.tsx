import type { JSX } from "react/jsx-runtime";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DraftRecoveryNotice } from "./DraftRecoveryNotice";
import { createDraftStore } from "./draft-store";
import { createDraftDatabase } from "./draft-database";

function RecoveryPreview(): JSX.Element {
  const [fixture] = useState(() => {
    let available = false;
    const database = createDraftDatabase();
    const store = createDraftStore(crypto.randomUUID(), "chapter", {
      transact: (change) =>
        available ? database.transact(change) : Promise.reject(new Error("数据库暂时不可用")),
    });
    return {
      store,
      retry: async (): Promise<void> => {
        available = true;
        await store.readRecovery();
      },
    };
  });
  return (
    <div className="w-96 bg-surface-stone-50 p-3">
      <DraftRecoveryNotice store={fixture.store} pageId="p" onRetry={fixture.retry} />
      <label>
        当前译文
        <textarea
          aria-label="当前译文"
          defaultValue="服务器内容"
          className="w-full border border-line-stone-200 bg-surface-white p-2 text-ink-stone-700"
        />
      </label>
    </div>
  );
}
const meta = {
  title: "Features/Translator/DraftRecovery",
  component: RecoveryPreview,
} satisfies Meta<typeof RecoveryPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RetryWhileEditing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("本地草稿未能恢复");
    const input = canvas.getByRole("textbox", { name: "当前译文" });
    await userEvent.clear(input);
    await userEvent.type(input, "继续编辑的内容");
    const retry = canvas.getByRole("button", { name: "重试恢复" });
    retry.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.queryByRole("alert")).not.toBeInTheDocument());
    await expect(input).toHaveValue("继续编辑的内容");
  },
};
