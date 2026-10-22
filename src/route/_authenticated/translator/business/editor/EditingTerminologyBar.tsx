import type { JSX } from "react";
import { TerminologyLookupBar } from "../terminology/TerminologyLookupBar";
import { useTermbaseExport } from "@/route/_authenticated/business/terminology/use-termbase-export";
import type { TranslatorModeProps } from "./mode-props";

type Props = TranslatorModeProps;

export function EditingTerminologyBar({ session }: Props): JSX.Element {
  const termbaseExport = useTermbaseExport(session.terminology, session.project.id);
  return <TerminologyLookupBar dataSource={session.terminology} termbaseExport={termbaseExport} />;
}
