"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredAdminToken } from "@/lib/admin-auth";

type CommentFormProps = {
  postId: number;
  parentId?: number | null;
  replyToAuthor?: string;
  onCancelReply?: () => void;
  onSubmitted: () => Promise<void>;
};

export function CommentForm({
  postId,
  parentId,
  replyToAuthor,
  onCancelReply,
  onSubmitted,
}: CommentFormProps) {
  const adminToken = getStoredAdminToken();
  const isAdminMode = Boolean(adminToken);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await apiFetch("/api/comments", {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({ postId, parentId, authorName, email, content }),
      });
      setAuthorName("");
      setEmail("");
      setContent("");
      setMessage("评论已提交，感谢你的留言。");
      await onSubmitted();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评论提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parentId && replyToAuthor && (
        <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-line)] bg-[var(--color-panel-soft)] px-4 py-3 text-sm">
          <span className="text-[var(--color-text)]">正在回复 {replyToAuthor}</span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-text)]"
            >
              取消回复
            </button>
          )}
        </div>
      )}
      {isAdminMode ? (
        <div className="rounded-[18px] border border-[var(--color-line)] bg-[var(--color-panel-soft)] px-4 py-3 text-sm text-[var(--color-text)]">
          当前将以站长身份发布{parentId ? "回复" : "评论"}。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="昵称"
            className="rounded-[18px] border border-[var(--color-line)] bg-white/90 px-4 py-3 text-sm outline-none"
            required
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱（可选）"
            className="rounded-[18px] border border-[var(--color-line)] bg-white/90 px-4 py-3 text-sm outline-none"
          />
        </div>
      )}
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="写下你的评论"
        className="min-h-[140px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/90 px-4 py-3 text-sm leading-7 outline-none"
        required
      />
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "提交中..." : isAdminMode ? (parentId ? "以站长身份回复" : "以站长身份评论") : "发表评论"}
        </button>
      </div>
    </form>
  );
}
