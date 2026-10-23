import { fireEvent, render, screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { expect, test, vi } from "vitest";
import { NavItem } from "./NavItem";

test("pointer and keyboard intent warm the target without navigating", () => {
  const onClick = vi.fn();
  const onIntent = vi.fn();
  render(
    <NavItem icon={BookOpen} label="漫画" isActive={false} onClick={onClick} onIntent={onIntent} />,
  );
  const button = screen.getByRole("button");
  fireEvent.pointerEnter(button);
  fireEvent.focus(button);
  fireEvent.pointerDown(button, { pointerType: "touch" });
  expect(onIntent).toHaveBeenCalledTimes(3);
  expect(onClick).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});
