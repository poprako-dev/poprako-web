import type { JSX } from "react";
import { issueAppearance } from "./issue-appearance";
import { IssueMarker } from "./IssueMarker";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
type Props = {
  scale: number;
  issues: IssueInfo[];
  focusedId: string | null;
  visible: boolean;
  onSelect: (id: string) => void;
};
export function IssueOverlay({ scale, issues, focusedId, visible, onSelect }: Props): JSX.Element {
  return (
    <>
      {visible &&
        issues.map(
          (issue) =>
            issue.rect && (
              <IssueMarker
                key={issue.id}
                appearance={issueAppearance(issue.variant)}
                id={issue.id}
                number={issue.index + 1}
                rect={issue.rect}
                scale={scale}
                isSelected={focusedId === issue.id}
                onSelect={onSelect}
              />
            ),
        )}
    </>
  );
}
