import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { reloadPage } from "@/shared/utility/reload-page";
import { Utilities } from "./Utilities";
import { createTeamTerminologyFixture } from "./team-terminology-fixture";
import { importFile } from "./team-terminology-test-fixture";

const loaders = vi.hoisted(() => ({ bounded: vi.fn(), terminology: vi.fn() }));
vi.mock("@/shared/utility/reload-page", () => ({ reloadPage: vi.fn() }));
vi.mock("./utility-modules", async () => {
  const { createModuleResource } = await import("@/shared/utility/module-resource");
  return {
    boundedCompressionModule: createModuleResource(loaders.bounded),
    teamTerminologyModule: createModuleResource(loaders.terminology),
  };
});
afterEach(cleanup);

test("offers explicit page reload after a bounded module download failure", async () => {
  loaders.bounded.mockRejectedValue(new Error("download failed"));
  const user = userEvent.setup();
  render(<Utilities />);
  await user.click(screen.getByRole("button", { name: "定界压缩" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("加载工具失败");
  expect(reloadPage).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "重试" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "刷新页面" }));
  expect(reloadPage).toHaveBeenCalledTimes(1);
  expect(loaders.bounded).toHaveBeenCalledTimes(1);
});

test("keeps a pending import through module failure until explicit reload", async () => {
  loaders.terminology.mockRejectedValue(new Error("download failed"));
  const user = userEvent.setup();
  render(
    <Utilities
      terminology={{
        teamId: "team-1",
        canEdit: true,
        dataSource: createTeamTerminologyFixture(),
      }}
    />,
  );
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), importFile());
  expect(await screen.findByRole("alert")).toHaveTextContent("加载工具失败");
  expect(reloadPage).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "打包并压缩" }));
  expect(screen.getByRole("button", { name: "导入术语库" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "查看术语库" }));
  await user.click(screen.getByRole("button", { name: "刷新页面" }));
  expect(reloadPage).toHaveBeenCalledTimes(1);
  expect(loaders.terminology).toHaveBeenCalledTimes(1);
});
