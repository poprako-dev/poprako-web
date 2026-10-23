import { type JSX, useCallback, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import clsx from "clsx";
import { ArchiveTool } from "./ArchiveTool";
import { AsyncBoundedCompressionTool } from "./AsyncBoundedCompressionTool";
import { UtilitiesNavigation } from "./UtilitiesNavigation";
import { archiveTools, type UtilityMode } from "./utility-mode";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";
import { AsyncTeamTerminologyTool } from "./AsyncTeamTerminologyTool";
import type { TeamTerminology } from "./team-terminology";

type Props = { terminology?: TeamTerminology | undefined };

export function Utilities({ terminology }: Props): JSX.Element {
  const [mode, setMode] = useState<UtilityMode>("compress");
  const [visited, setVisited] = useState<ReadonlySet<UtilityMode>>(() => new Set(["compress"]));
  const selectMode = useCallback((next: UtilityMode) => {
    setVisited((current) => new Set([...current, next]));
    setMode(next);
  }, []);
  const toolRef = useRef<TeamTerminologyHandle>(null);
  const activateTerminology = useCallback(() => {
    selectMode("termbases");
  }, [selectMode]);
  return (
    <div
      className={clsx(
        "mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden",
        "px-4 py-[clamp(0.75rem,3dvh,2rem)] text-foreground sm:px-6 lg:px-10",
      )}
    >
      <header className="mb-4 flex shrink-0 items-center gap-3">
        <Wrench size={22} strokeWidth={1.6} className="text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">实用工具</h1>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-8 lg:gap-10">
        <UtilitiesNavigation
          mode={mode}
          onSelect={selectMode}
          teamId={terminology?.teamId}
          canEdit={terminology?.canEdit ?? false}
          toolRef={toolRef}
        />
        {archiveTools
          .filter((item) => visited.has(item.id))
          .map((item) => (
            <div key={item.id} hidden={mode !== item.id} className="min-h-0 min-w-0 flex-1">
              {item.id === "bounded" ? (
                <AsyncBoundedCompressionTool />
              ) : (
                <ArchiveTool mode={item.id} />
              )}
            </div>
          ))}
        <div hidden={mode !== "termbases"} className="min-h-0 min-w-0 flex-1">
          {terminology ? (
            <AsyncTeamTerminologyTool
              key={terminology.teamId}
              ref={toolRef}
              terminology={terminology}
              visited={visited.has("termbases")}
              active={mode === "termbases"}
              onActivate={activateTerminology}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暂无可用汉化组
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
