import { Utilities } from "@/route/_authenticated/_shell/(utility)/business/Utilities";

function UtilitiesPage(): ReactElement {
  return <Utilities />;
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/(utility)/utilities")({
  component: UtilitiesPage,
});
import type { ReactElement } from "react";
