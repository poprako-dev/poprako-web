import { act, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { TerminologyDataSource } from "../contract/terminology";
import { TermPanel } from "./TermPanel";

function createDataSource(listTerms: TerminologyDataSource["listTerms"]): TerminologyDataSource {
  return {
    listTerms,
    listTermbases: vi.fn(),
    createTermbase: vi.fn(),
    updateTermbase: vi.fn(),
    deleteTermbase: vi.fn(),
    createTerm: vi.fn(),
    updateTerm: vi.fn(),
    deleteTerm: vi.fn(),
  };
}

test.each([false, true])("stops loading after the response (StrictMode: %s)", async (strict) => {
  const listTerms = vi.fn<TerminologyDataSource["listTerms"]>();
  let complete: (value: Awaited<ReturnType<typeof listTerms>>) => void = () => undefined;
  const response = new Promise<Awaited<ReturnType<typeof listTerms>>>((resolve) => {
    complete = resolve;
  });
  listTerms.mockReturnValue(response);
  render(
    <TermPanel
      dataSource={createDataSource(listTerms)}
      termbase={{
        id: "base-1",
        comicId: "comic-1",
        name: "测试用术语库",
        termCount: 0,
        creatorId: "user-1",
        createdAt: 1,
        updatedAt: 1,
      }}
      query=""
      revision={0}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      onError={vi.fn()}
    />,
    { reactStrictMode: strict },
  );
  expect(screen.getByRole("status", { name: "正在加载术语数据" })).toBeVisible();
  await act(async () => {
    complete({ success: true, data: [] });
    await response;
  });
  expect(screen.queryByRole("status", { name: "正在加载术语数据" })).not.toBeInTheDocument();
  expect(screen.getByText("没有匹配的术语")).toBeVisible();
});
