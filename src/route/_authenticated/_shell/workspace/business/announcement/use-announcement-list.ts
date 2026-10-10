import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AnnouncementInfo } from "./announcement";
import { listAnnouncements } from "./announcement-request";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

export type AnnouncementListState = {
  announcements: AnnouncementInfo[];
  setAnnouncements: Dispatch<SetStateAction<AnnouncementInfo[]>>;
  loading: boolean;
  load: () => Promise<void>;
};

export function useAnnouncementList(teamId: string): AnnouncementListState {
  const client = useApiClient();
  const { showToast } = useToastStore();
  const [announcements, setAnnouncements] = useState<AnnouncementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const requestSequenceRef = useRef(0);
  const load = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequenceRef.current;
    setLoading(true);
    const result = await listAnnouncements(client, { teamId, offset: 0, limit: 3 });
    if (sequence !== requestSequenceRef.current) return;
    setLoading(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 加载公告失败:", result.error);
      showLocalApiFailure(result, showToast, "加载公告失败");
      return;
    }
    setAnnouncements(result.data.slice(0, 3));
  }, [client, showToast, teamId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { announcements, setAnnouncements, loading, load };
}
