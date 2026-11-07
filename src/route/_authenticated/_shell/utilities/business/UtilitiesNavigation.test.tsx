import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { UtilitiesNavigation } from "./UtilitiesNavigation";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";

afterEach(cleanup);

function renderNavigation(): void {
  render(
    <UtilitiesNavigation
      mode="compress"
      onSelect={() => undefined}
      teamId="team"
      canEdit={false}
      toolRef={createRef<TeamTerminologyHandle>()}
    />,
  );
}

test("local apps link to their release pages in a new tab", () => {
  renderNavigation();
  expect(screen.getByRole("heading", { name: "本地版应用" })).toBeVisible();
  const translator = screen.getByRole("link", { name: "翻校器" });
  expect(translator).toHaveAttribute(
    "href",
    "https://github.com/poprako-dev/poprako-native/releases",
  );
  expect(translator).toHaveAttribute("target", "_blank");
  expect(translator).toHaveAttribute("rel", "noopener noreferrer");
  const reviewer = screen.getByRole("link", { name: "监修器" });
  expect(reviewer).toHaveAttribute("href", "https://github.com/gunfub/MangaProof/releases");
  expect(reviewer).toHaveAttribute("target", "_blank");
  expect(reviewer).toHaveAttribute("rel", "noopener noreferrer");
});
