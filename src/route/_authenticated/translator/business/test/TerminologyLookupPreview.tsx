import type { ReactElement } from "react";
import type { TerminologyDataSource } from "../contract/terminology";
import { TerminologyLookupBar } from "../terminology/TerminologyLookupBar";
import { useTermbaseExport } from "../terminology/use-termbase-export";

type Props = { dataSource: TerminologyDataSource };

export function TerminologyLookupPreview({ dataSource }: Props): ReactElement {
  const termbaseExport = useTermbaseExport(dataSource, "story-project");
  return <TerminologyLookupBar dataSource={dataSource} termbaseExport={termbaseExport} />;
}
