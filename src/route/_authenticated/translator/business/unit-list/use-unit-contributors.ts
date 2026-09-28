import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { UserInfo } from "@/route/business/identity/user";
import {
  UnitContributorCache,
  unitContributorIds,
  type UnitUserResolver,
} from "@/route/_authenticated/translator/business/unit-list/unit-contributor-cache";

type Args = {
  units: UnitInfo[];
  onResolveUser: UnitUserResolver;
};

export function useUnitContributors({
  units,
  onResolveUser,
}: Args): (userId: string | null) => UserInfo | undefined {
  const cacheRef = useRef(new UnitContributorCache());
  const contributorIds = useMemo(() => unitContributorIds(units), [units]);
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, UserInfo>>(() => new Map());

  useEffect(() => {
    let isActive = true;

    for (const userId of contributorIds) {
      void cacheRef.current.resolve(userId, onResolveUser).then((user) => {
        if (isActive && user) {
          setResolvedUsers((current) => {
            const next = new Map(current);
            next.set(userId, user);
            return next;
          });
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [contributorIds, onResolveUser]);

  return useCallback(
    (userId: string | null): UserInfo | undefined =>
      userId === null ? undefined : resolvedUsers.get(userId),
    [resolvedUsers],
  );
}
