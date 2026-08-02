import type { MemberInfo } from "@/types/member";
import type { RoleFilter } from "../../types/types";
import MemberListFilterHeader from "./MemberListFilterHeader";
import EmbeddedMemberList from "./EmbeddedMemberList";

type Props = {
  fuzzyName: string;
  onChangeFuzzyName: (name: string) => void;
  activeRole: RoleFilter | null;
  onChangeRole: (role: RoleFilter | null) => void;
  onCreateMember: () => void;
  onLoadMembers: (
    offset: number,
    limit: number,
  ) => Promise<MemberInfo[] | string>;
  onMemberClick?: (member: MemberInfo) => void;
  onlineUserIds?: ReadonlySet<string>;
};

export default function MemberList({
  fuzzyName,
  onChangeFuzzyName,
  activeRole,
  onChangeRole,
  onCreateMember,
  onLoadMembers,
  onMemberClick,
  onlineUserIds,
}: Props) {
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
        <EmbeddedMemberList
          onLoadMembers={onLoadMembers}
          onMemberClick={onMemberClick}
          onlineUserIds={onlineUserIds}
        />
      </div>
    </div>
  );
}
