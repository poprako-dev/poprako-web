import { useImperativeHandle, type Ref } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Utilities } from "./Utilities";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";
import type { TeamTerminology } from "./team-terminology";
import { createTeamTerminologyFixture } from "./team-terminology-fixture";
import { deferred, importFile } from "./team-terminology-test-fixture";

const mocks = vi.hoisted(() => ({ load: vi.fn(), imported: vi.fn() }));
vi.mock("./utility-modules", async () => {
  const { createModuleResource } = await import("@/shared/utility/module-resource");
  return {
    teamTerminologyModule: createModuleResource(mocks.load),
    boundedCompressionModule: createModuleResource(() => import("./BoundedCompressionTool")),
  };
});

function TerminologyFixture({
  terminology,
  ref,
}: {
  terminology: TeamTerminology;
  ref?: Ref<TeamTerminologyHandle>;
}): null {
  useImperativeHandle(
    ref,
    () => ({
      importFile(file) {
        mocks.imported(terminology.teamId, file);
        return Promise.resolve(true);
      },
    }),
    [terminology.teamId],
  );
  return null;
}
function team(teamId: string): TeamTerminology {
  return { teamId, canEdit: true, dataSource: createTeamTerminologyFixture() };
}
afterEach(cleanup);

test("waits for first import download and discards the previous team's pending file", async () => {
  const download = deferred<{ TeamTerminologyTool: typeof TerminologyFixture }>();
  mocks.load.mockReturnValue(download.promise);
  const view = render(<Utilities terminology={team("old")} />);
  const user = userEvent.setup();
  expect(mocks.load).not.toHaveBeenCalled();
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), importFile());
  expect(screen.getByRole("button", { name: "导入术语库" })).toBeDisabled();
  expect(mocks.imported).not.toHaveBeenCalled();
  view.rerender(<Utilities terminology={team("new")} />);
  const currentFile = importFile();
  await user.upload(screen.getByLabelText("选择团队术语库 JSON 文件"), currentFile);
  await act(async () => {
    download.resolve({ TeamTerminologyTool: TerminologyFixture });
    await download.promise;
  });
  await waitFor(() => {
    expect(mocks.imported).toHaveBeenCalledExactlyOnceWith("new", currentFile);
  });
  expect(mocks.load).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "导入术语库" })).toBeEnabled();
});
