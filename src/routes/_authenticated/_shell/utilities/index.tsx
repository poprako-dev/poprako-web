import { Utilities } from "@/routes/_authenticated/_shell/utilities/business/Utilities";

export function UtilitiesPage(): ReactElement {
  return <Utilities />;
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/utilities/")({
  component: UtilitiesPage,
});
import type { ReactElement } from "react";
