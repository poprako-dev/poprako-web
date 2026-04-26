import type { MemberInfo } from "@/types/member";
import type { RoleFilter } from "../../types/types";
import MemberListFilterHeader from "./MemberListFilterHeader";
import EmbeddedMemberList from "./EmbeddedMemberList";

type Props = {
  fuzzyName: string;
  onChangeFuzzyName: (name: string) => void;
  activeRoles: RoleFilter[];
  onChangeRoles: (roles: RoleFilter[]) => void;
  onCreateMember: () => void;
  onLoadMembers: (
    offset: number,
    limit: number,
  ) => Promise<MemberInfo[] | string>;
  onMemberClick?: (member: MemberInfo) => void;
};

export default function MemberList({
  fuzzyName,
  onChangeFuzzyName,
  activeRoles,
  onChangeRoles,
  onCreateMember,
  onLoadMembers,
  onMemberClick,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <MemberListFilterHeader
        activeFuzzyName={fuzzyName}
        onChangeFuzzyName={onChangeFuzzyName}
        activeRoles={activeRoles}
        onChangeRoles={onChangeRoles}
        onCreateMember={onCreateMember}
      />
      <div className="min-h-0 flex-1">
        <EmbeddedMemberList
          onLoadMembers={onLoadMembers}
          onMemberClick={onMemberClick}
        />
      </div>
    </div>
  );
}
