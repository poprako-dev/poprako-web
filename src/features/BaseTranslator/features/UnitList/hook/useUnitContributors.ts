import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UnitInfo } from "@/types/unit";
import type { UserInfo } from "@/types/user";
import {
  UnitContributorCache,
  unitContributorIds,
  type UnitUserResolver,
} from "./unitContributorCache";

type Args = {
  units: UnitInfo[];
  onResolveUser: UnitUserResolver;
};

export function useUnitContributors({ units, onResolveUser }: Args) {
  const cacheRef = useRef(new UnitContributorCache());
  const [, setRevision] = useState(0);
  const contributorIds = useMemo(() => unitContributorIds(units), [units]);
  const contributorKey = contributorIds.join("\u0000");

  useEffect(() => {
    let active = true;

    contributorIds.forEach((userId) => {
      void cacheRef.current.resolve(userId, onResolveUser).then((user) => {
        if (active && user) setRevision((revision) => revision + 1);
      });
    });

    return () => {
      active = false;
    };
    // contributorKey captures the deduplicated IDs without retriggering on array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributorKey, onResolveUser]);

  return useCallback(
    (userId: string | null): UserInfo | undefined =>
      cacheRef.current.get(userId),
    [],
  );
}
