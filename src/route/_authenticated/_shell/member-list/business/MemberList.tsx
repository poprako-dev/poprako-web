import type { JSX } from "react";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import type { RoleFilter } from "@/route/_authenticated/_shell/member-list/business/member-list-type";
import { MemberListFilterHeader } from "@/route/_authenticated/_shell/member-list/business/MemberListFilterHeader";
import { EmbeddedMemberList } from "@/route/_authenticated/_shell/member-list/business/EmbeddedMemberList";

type Props = {
  fuzzyName: string;
  onChangeFuzzyName: (name: string) => void;
  activeRole: RoleFilter | null;
  onChangeRole: (role: RoleFilter | null) => void;
  onCreateMember: () => void;
  onLoadMembers: (offset: number, limit: number) => Promise<Result<MemberInfo[]>>;
  onMemberClick?: ((member: MemberInfo) => void) | undefined;
};

export function MemberList({
  fuzzyName,
  onChangeFuzzyName,
  activeRole,
  onChangeRole,
  onCreateMember,
  onLoadMembers,
  onMemberClick,
}: Props): JSX.Element {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <MemberListFilterHeader
        activeFuzzyName={fuzzyName}
        onChangeFuzzyName={onChangeFuzzyName}
        activeRole={activeRole}
        onChangeRole={onChangeRole}
        onCreateMember={onCreateMember}
      />
      <div className="min-h-0 flex-1">
        <EmbeddedMemberList onLoadMembers={onLoadMembers} onMemberClick={onMemberClick} />
      </div>
    </div>
  );
}
