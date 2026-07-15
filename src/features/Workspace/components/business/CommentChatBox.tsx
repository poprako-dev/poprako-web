import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import type { CommentInfo } from "@/types/comment";

type Props = {
  comments: CommentInfo[];
  loading: boolean;
  onSend: (content: string) => Promise<void>;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${mo}/${day} ${h}:${m}`;
}

function avatarChar(name: string | undefined): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function CommentChatBox({ comments, loading, onSend }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");
    await onSend(trimmed);
    setSending(false);
  }, [input, sending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className={clsx(
        "flex flex-col h-full rounded-sm",
        "bg-stone-50/40 text-foreground",
      )}
    >
      {/* message list — inner flex-col pushes content to bottom */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className={clsx("flex flex-col", "px-3 py-3 gap-3")}>
          {loading && (
            <div className="flex justify-center py-8">
              <span className="text-sm text-muted-foreground">加载中…</span>
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="flex justify-center py-8">
              <span className="text-sm text-muted-foreground">
                还没有留言，来打第一发吧
              </span>
            </div>
          )}
          {!loading &&
            comments.map((c) => {
              const name = c.user?.name ?? c.userId;
              return (
                <div key={c.id}>
                  {/* avatar + name / time */}
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        "shrink-0 w-7 h-7 rounded-full",
                        "flex items-center justify-center",
                        "text-xs font-medium select-none",
                        "bg-stone-100 overflow-hidden",
                      )}
                    >
                      {c.user?.avatarThumbnailUrl || c.user?.avatarUrl ? (
                        <img
                          src={c.user.avatarThumbnailUrl || c.user.avatarUrl}
                          alt={c.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[var(--color-green-500)]">
                          {avatarChar(c.user?.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={clsx(
                          "text-xs font-medium text-foreground leading-tight",
                        )}
                      >
                        {name}
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] text-muted-foreground leading-tight",
                        )}
                      >
                        {formatTime(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  {/* content */}
                  <p
                    className={clsx(
                      "mt-1.5 text-sm leading-snug wrap-break-word",
                      "whitespace-pre-wrap",
                      "px-3 py-1.5 rounded-xl rounded-tl-sm",
                      "bg-stone-100/80 text-foreground",
                    )}
                  >
                    {c.content}
                  </p>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* divider */}
      <div className="h-px bg-stone-200 mx-3 shrink-0" />

      {/* input row */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5">
        <textarea
          className={clsx(
            "flex-1 resize-none rounded-lg px-3 py-1.5",
            "text-sm leading-relaxed bg-white/80 text-foreground",
            "placeholder:text-stone-400",
            "border border-stone-200",
            "focus:outline-none focus:border-[var(--color-green-500)]/40",
            "transition-colors min-h-8 max-h-24",
          )}
          rows={1}
          placeholder="写下你的留言吧…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className={clsx(
            "shrink-0",
            input.trim() && !sending
              ? "text-[var(--color-green-500)] hover:bg-[var(--color-green-50)]/50"
              : "text-muted-foreground",
          )}
          aria-label="发送"
        >
          <Send size={15} />
        </Button>
      </div>
    </div>
  );
}
