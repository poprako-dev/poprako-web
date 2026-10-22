import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Utilities } from "./Utilities";
import { boundedCompressionModule } from "./utility-modules";

const loadBounded = vi.hoisted(() => vi.fn());

vi.mock("./utility-modules", async () => {
  const { createModuleResource } = await import("@/shared/utility/module-resource");
  return {
    boundedCompressionModule: createModuleResource(loadBounded),
    teamTerminologyModule: createModuleResource(() => import("./TeamTerminologyTool")),
  };
});

function BoundedFixture(): React.JSX.Element {
  const [value, setValue] = useState("");
  return (
    <input
      aria-label="大小上限"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
    />
  );
}

afterEach(cleanup);

test("loads tools on first visit and preserves visited instances", async () => {
  loadBounded.mockResolvedValue({ BoundedCompressionTool: BoundedFixture });
  const user = userEvent.setup();
  render(<Utilities />);
  expect(loadBounded).not.toHaveBeenCalled();
  expect(screen.getAllByLabelText("选择嵌稿文件")).toHaveLength(1);
  expect(screen.queryByLabelText("大小上限")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "定界压缩" }));
  const size = await screen.findByRole("textbox", { name: "大小上限" });
  await user.type(size, "1024");
  await user.click(screen.getByRole("button", { name: "解压并解包" }));
  expect(screen.getAllByLabelText("选择嵌稿文件")).toHaveLength(2);
  expect(size).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "定界压缩" }));
  expect(screen.getByRole("textbox", { name: "大小上限" })).toBe(size);
  expect(size).toHaveValue("1024");
  expect(loadBounded).toHaveBeenCalledTimes(1);
  expect(boundedCompressionModule.getSnapshot().status).toBe("ready");
});
