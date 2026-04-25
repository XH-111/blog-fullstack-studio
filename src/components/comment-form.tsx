"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type CommentFormProps = {
  postId: number;
  onSubmitted: () => Promise<void>;
};

export function CommentForm({ postId, onSubmitted }: CommentFormProps) {
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
        body: JSON.stringify({ postId, authorName, email, content }),
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
          {submitting ? "提交中..." : "发表评论"}
        </button>
      </div>
    </form>
  );
}
