import type { ReactElement } from "react";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import { TerminologyLookupBar } from "../terminology/TerminologyLookupBar";
import { useTermbaseExport } from "@/route/_authenticated/business/terminology/use-termbase-export";

type Props = { dataSource: TerminologyDataSource };

export function TerminologyLookupPreview({ dataSource }: Props): ReactElement {
  const termbaseExport = useTermbaseExport(dataSource, "story-project");
  return <TerminologyLookupBar dataSource={dataSource} termbaseExport={termbaseExport} />;
}
