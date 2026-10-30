import type { ReadySession } from "@/route/business/session/ready-session";
import { useAppStore } from "@/route/business/session/session-store";
import { readmeAvatarImage } from "@/test-resource/readme-artwork";

const timestamp = 1792972800000;
const user = {
  id: "readme-user",
  name: "青禾",
  qq: "10000001",
  avatarUrl: readmeAvatarImage(0),
  isSuperAdmin: false,
  lastActiveAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const readmeSession: ReadySession = {
  generation: 0,
  userInfo: user,
  memberInfos: [
    {
      id: "readme-member",
      userId: user.id,
      user,
      teamId: "readme-team",
      roles: 255,
      team: {
        id: "readme-team",
        name: "风铃汉化组",
        description: "把喜欢的故事，送到更多人身边。",
        avatarUrl: readmeAvatarImage(3),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
  ],
};

export function prepareReadmeSession(): () => void {
  const previous = useAppStore.getState();
  useAppStore.setState({
    accessToken: "readme-local",
    loginState: readmeSession,
    selectedTeamId: "readme-team",
    generation: 0,
  });
  return () => {
    useAppStore.setState(previous);
  };
}
