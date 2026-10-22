import type { ApiClient } from "@/api/client";
import { createComment } from "@/api/comment";
import type { UserInfo } from "@/route/business/identity/user";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { CommentInfo } from "./comment";
import { listComments } from "./comment-request";

type Options = {
  client: ApiClient;
  teamId: string | null;
  user: UserInfo;
  showToast: (message: string, type: "error") => unknown;
};

type Snapshot = { comments: CommentInfo[]; commentsLoading: boolean };

export class WorkspaceCommentsController {
  private snapshot: Snapshot = { comments: [], commentsLoading: false };
  private readonly listeners = new Set<() => void>();
  private readonly sent = new Map<string, CommentInfo>();
  private reading: AbortController | null = null;
  private active = false;
  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
    this.snapshot = { comments: [], commentsLoading: Boolean(options.teamId) };
  }

  getSnapshot = (): Snapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(changes: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...changes };
    for (const listener of this.listeners) listener();
  }

  start(): void {
    this.active = true;
    void this.refresh();
  }

  dispose(): void {
    this.active = false;
    this.reading?.abort();
    this.reading = null;
  }

  refresh = async (): Promise<void> => {
    if (!this.active || !this.options.teamId) return;
    this.reading?.abort();
    const request = new AbortController();
    this.reading = request;
    this.publish({ commentsLoading: true });
    try {
      await this.read(request);
    } catch (error) {
      if (this.isCurrent(request)) {
        console.error("[Workspace] 加载留言失败:", error);
        showLocalCaughtError(error, this.options.showToast, "加载留言失败");
      }
    } finally {
      if (this.isCurrent(request)) {
        this.reading = null;
        this.publish({ commentsLoading: false });
      }
    }
  };

  private isCurrent(request: AbortController): boolean {
    return this.active && this.reading === request && !request.signal.aborted;
  }

  private isActive(): boolean {
    return this.active;
  }

  private async read(request: AbortController): Promise<void> {
    const { client, teamId, showToast } = this.options;
    if (!teamId) return;
    const previousSends = new Set(this.sent.keys());
    const result = await listComments(
      client,
      { teamId, offset: 0, limit: 15, includes: ["user"] },
      request.signal,
    );
    if (!this.isCurrent(request)) return;
    if (!result.success) {
      console.error("[Workspace] 加载留言失败:", result.error);
      showLocalApiFailure(result, showToast, "加载留言失败");
      return;
    }
    // The server window supersedes earlier sends, including those now outside its limit.
    for (const id of previousSends) this.sent.delete(id);
    for (const comment of result.data) this.sent.delete(comment.id);
    this.publish({ comments: [...result.data].reverse().concat([...this.sent.values()]) });
  }

  send = async (content: string): Promise<void> => {
    const { client, teamId, user, showToast } = this.options;
    if (!this.isActive() || !teamId) return;
    try {
      // A write may already have taken effect; only its UI result is scoped to this owner.
      const result = await createComment(client, { teamId, content });
      if (!this.isActive()) return;
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error);
        showLocalApiFailure(result, showToast, "发送留言失败");
        return;
      }
      const comment = {
        id: result.data,
        teamId,
        userId: user.id,
        user,
        content,
        createdAt: Date.now(),
      };
      this.sent.set(comment.id, comment);
      const comments = this.snapshot.comments.filter((item) => item.id !== comment.id);
      this.publish({ comments: [...comments, comment] });
    } catch (error) {
      if (!this.isActive()) return;
      console.error("[Workspace] 发送留言失败:", error);
      showLocalCaughtError(error, showToast, "发送留言失败");
    }
  };
}
