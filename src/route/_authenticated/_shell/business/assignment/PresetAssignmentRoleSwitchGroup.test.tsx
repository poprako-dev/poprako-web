import { useState } from "react";
import type { JSX } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import type { WorkerRole } from "@/route/business/identity/role";
import { PresetAssignmentRoleSwitchGroup } from "./PresetAssignmentRoleSwitchGroup";

type Props = { roles: number };

function Preset({ roles }: Props): JSX.Element {
  const [value, setValue] = useState<WorkerRole[]>([]);
  return (
    <PresetAssignmentRoleSwitchGroup
      activeMember={{ id: "member", userId: "user", teamId: "team", roles }}
      value={value}
      onChange={setValue}
    />
  );
}

test("creator assignments contain seven optional worker roles and no mandatory management role", () => {
  render(<Preset roles={255} />);
  const group = within(screen.getByRole("group", { name: "创建者分工" }));
  expect(group.getAllByRole("button")).toHaveLength(7);
  expect(group.queryByRole("button", { name: "管理" })).not.toBeInTheDocument();
  expect(group.getAllByRole("button", { pressed: false })).toHaveLength(7);
  const translator = group.getByRole("button", { name: "翻译" });
  fireEvent.click(translator);
  expect(translator).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(translator);
  expect(translator).toHaveAttribute("aria-pressed", "false");
});

test("team administrator status does not grant worker roles to the creator", () => {
  render(<Preset roles={128} />);
  for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
});
