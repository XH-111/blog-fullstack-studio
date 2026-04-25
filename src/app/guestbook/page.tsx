"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, GuestbookMessageRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

const maxMessageLength = 100;

export default function GuestbookPage() {
  const [messages, setMessages] = useState<GuestbookMessageRecord[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadMessages() {
    const result = await apiFetch<GuestbookMessageRecord[]>("/api/guestbook");
    setMessages(result);
  }

  useEffect(() => {
    loadMessages().catch((error) => {
      setMessage(error instanceof Error ? error.message : "留言加载失败");
    });
  }, []);

  const remaining = useMemo(() => maxMessageLength - content.length, [content.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!content.trim()) {
      setMessage("请先写下留言内容");
      return;
    }

    if (content.trim().length > maxMessageLength) {
      setMessage(`留言最多 ${maxMessageLength} 字`);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await apiFetch<GuestbookMessageRecord>("/api/guestbook", {
        method: "POST",
        body: JSON.stringify({
          authorName,
          content,
          isPrivate,
        }),
      });

      setAuthorName("");
      setContent("");
      setIsPrivate(false);
      setMessage(isPrivate ? "私密留言已提交，只有管理员能看到。" : "留言已发布。");
      await loadMessages();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "留言提交失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="留言板"
        description="留下想说的话，也可以选择只给站长看的私密留言。"
        image="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="relative z-10 mx-auto -mt-8 grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <SurfaceCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                New Message
              </p>
              <h1 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
                写一条留言
              </h1>
            </div>

            <label className="block space-y-2 text-sm text-[var(--color-text)]">
              <span>昵称</span>
              <input
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                maxLength={24}
                placeholder="匿名访客"
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>

            <label className="block space-y-2 text-sm text-[var(--color-text)]">
              <span>留言内容</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, maxMessageLength))}
                maxLength={maxMessageLength}
                placeholder="最多 100 字"
                className="min-h-[140px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="inline-flex items-center gap-2 text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                私密留言
              </label>
              <span className={remaining < 10 ? "text-[#b44a5a]" : "text-[var(--color-text-faint)]"}>
                还可输入 {remaining} 字
              </span>
            </div>

            {isPrivate && (
              <div className="rounded-[18px] border border-[#f1c8d2] bg-[#fff4f6] px-4 py-3 text-sm leading-6 text-[#9c4053]">
                你正在提交私密留言。它不会公开显示，因此你将无法在前台得到回复。
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "提交中..." : "提交留言"}
              </button>
            </div>
          </form>
        </SurfaceCard>

        <div className="space-y-4">
          {messages.map((item) => (
            <SurfaceCard key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl text-[var(--color-ink)]">{item.authorName}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                    {new Date(item.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs text-[var(--color-accent)]">
                  公开留言
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text)]">{item.content}</p>
              {item.replyContent && (
                <div className="mt-4 rounded-[18px] bg-[var(--color-panel-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                    站长回复
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                    {item.replyContent}
                  </p>
                </div>
              )}
            </SurfaceCard>
          ))}

          {messages.length === 0 && (
            <SurfaceCard>
              <p className="text-sm text-[var(--color-text)]">还没有公开留言。</p>
            </SurfaceCard>
          )}
        </div>
      </section>
    </main>
  );
}
