import type { ReactElement } from "react";
import { MemberGlance } from "@/routes/_authenticated/_shell/member-list/business/MemberGlance";

export function MemberGlancePage(): ReactElement {
  return (
    <div className="h-full w-full min-w-0 overflow-x-hidden">
      <MemberGlance />
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/member-list/")({
  component: MemberGlancePage,
});
