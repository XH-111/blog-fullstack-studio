"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, GuestbookMessageRecord, PostRecord } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";

type Summary = {
  postCount: number;
  commentCount: number;
  categoryCount: number;
  tagCount: number;
};

const maxReplyLength = 100;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessageRecord[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [isPostsOpen, setIsPostsOpen] = useState(false);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [guestbookSearch, setGuestbookSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [token] = useState(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("blog_admin_token")) || ""
  );

  async function loadGuestbookMessages(currentToken = token) {
    const list = await apiFetch<GuestbookMessageRecord[]>("/api/guestbook/admin", {
      token: currentToken,
    });
    setGuestbookMessages(list);
    setReplyDrafts(Object.fromEntries(list.map((item) => [item.id, item.replyContent || ""])));
  }

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    Promise.all([
      apiFetch<PostRecord[]>("/api/posts?includeDrafts=true"),
      apiFetch<Summary>("/api/dashboard/summary", { token }),
      apiFetch<GuestbookMessageRecord[]>("/api/guestbook/admin", { token }),
    ])
      .then(([postList, summaryData, guestbookList]) => {
        setPosts(postList);
        setSummary(summaryData);
        setGuestbookMessages(guestbookList);
        setReplyDrafts(Object.fromEntries(guestbookList.map((item) => [item.id, item.replyContent || ""])));
      })
      .catch(() => router.push("/admin/login"));
  }, [router, token]);

  const filteredPosts = useMemo(() => {
    const keyword = postSearch.trim().toLowerCase();
    const matchedPosts = !keyword
      ? posts
      : posts.filter((post) =>
          [
            post.title,
            post.excerpt,
            post.contentText || "",
            post.contentMarkdown || "",
            post.category.name,
            post.status === "PUBLISHED" ? "已发布" : "草稿",
            post.isFeatured ? "置顶 featured" : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        );

    return [...matchedPosts].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      const aTime = Date.parse(a.publishedAt || a.updatedAt || a.createdAt);
      const bTime = Date.parse(b.publishedAt || b.updatedAt || b.createdAt);
      return bTime - aTime;
    });
  }, [postSearch, posts]);

  const filteredGuestbookMessages = useMemo(() => {
    const keyword = guestbookSearch.trim().toLowerCase();
    if (!keyword) {
      return guestbookMessages;
    }

    return guestbookMessages.filter((item) => {
      const searchable = [
        item.authorName,
        item.content,
        item.replyContent || "",
        item.isPrivate ? "私密留言 private" : "公开留言 public",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }, [guestbookMessages, guestbookSearch]);

  async function handleDelete(post: PostRecord) {
    if (!token) {
      return;
    }

    if (!window.confirm(`确认删除《${post.title}》吗？删除后不可恢复。`)) {
      return;
    }

    await apiFetch(`/api/posts/${post.id}`, {
      method: "DELETE",
      token,
    });
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  async function handleStatusChange(postId: number, status: "DRAFT" | "PUBLISHED") {
    if (!token) {
      return;
    }

    const updated = await apiFetch<PostRecord>(`/api/posts/${postId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });

    setPosts((current) => current.map((item) => (item.id === postId ? updated : item)));
  }

  async function handleFeaturedChange(post: PostRecord) {
    if (!token) {
      return;
    }

    if (post.status !== "PUBLISHED" && !post.isFeatured) {
      setMessage("只有已发布文章才能置顶到首页。");
      return;
    }

    const updated = await apiFetch<PostRecord>(`/api/posts/${post.id}/featured`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isFeatured: !post.isFeatured }),
    });

    setPosts((current) => current.map((item) => (item.id === post.id ? updated : item)));
    setMessage(updated.isFeatured ? "文章已置顶到首页。" : "已取消文章置顶。");
  }

  async function handleReply(messageId: number) {
    if (!token) {
      return;
    }

    const replyContent = (replyDrafts[messageId] || "").trim();
    if (replyContent.length > maxReplyLength) {
      setMessage(`回复最多 ${maxReplyLength} 字。`);
      return;
    }

    await apiFetch<GuestbookMessageRecord>(`/api/guestbook/${messageId}/reply`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ replyContent }),
    });
    setMessage(replyContent ? "留言回复已保存。" : "留言回复已清空。");
    await loadGuestbookMessages();
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("两次输入的新密码不一致。");
      return;
    }

    try {
      await apiFetch("/api/auth/password", {
        method: "PATCH",
        token,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("密码已更新，下次登录请使用新密码。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修改密码失败");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[var(--color-ink)]">内容后台</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            管理文章、分类、站点设置、留言板和首页置顶文章。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/settings" className="rounded-full border border-[var(--color-line)] bg-white/88 px-5 py-2.5 text-sm">
            站点设置
          </Link>
          <Link href="/admin/taxonomies" className="rounded-full border border-[var(--color-line)] bg-white/88 px-5 py-2.5 text-sm">
            分类与标签
          </Link>
          <Link href="/admin/posts/new" className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white">
            新建文章
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["文章数", summary.postCount],
            ["评论数", summary.commentCount],
            ["分类数", summary.categoryCount],
            ["标签数", summary.tagCount],
          ].map(([label, value]) => (
            <SurfaceCard key={String(label)}>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-faint)]">{label}</p>
              <p className="mt-4 font-serif text-4xl text-[var(--color-ink)]">{value}</p>
            </SurfaceCard>
          ))}
        </div>
      )}

      <SurfaceCard>
        <button
          type="button"
          onClick={() => setIsPasswordOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">账号安全</h2>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">修改当前管理员登录密码。</p>
          </div>
          <span className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm text-[var(--color-text)]">
            {isPasswordOpen ? "收起" : "更改密码"}
          </span>
        </button>

        {isPasswordOpen && (
          <form onSubmit={handleChangePassword} className="mt-5 grid gap-4 md:grid-cols-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="当前密码"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="新密码，至少 8 位"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="确认新密码"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <div className="md:col-span-3 flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                保存新密码
              </button>
            </div>
          </form>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <button
          type="button"
          onClick={() => setIsPostsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">文章管理</h2>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              共 {posts.length} 篇文章，已置顶 {posts.filter((post) => post.isFeatured).length} 篇。
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm text-[var(--color-text)]">
            {isPostsOpen ? "收起" : "展开"}
          </span>
        </button>

        {isPostsOpen && (
          <div className="mt-5 grid gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={postSearch}
                onChange={(event) => setPostSearch(event.target.value)}
                placeholder="搜索标题、摘要、正文、分类、状态或置顶文章"
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none md:max-w-md"
              />
              <span className="text-sm text-[var(--color-text-faint)]">
                {message || `当前显示 ${filteredPosts.length} 篇`}
              </span>
            </div>

            {filteredPosts.map((post) => {
              const isPublished = post.status === "PUBLISHED";

              return (
                <div
                  key={post.id}
                  className="rounded-[22px] border border-[var(--color-line)] bg-white/76 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-faint)]">
                        <span>{post.category.name}</span>
                        <span>{isPublished ? "已发布" : "草稿"}</span>
                        <span>{post.commentCount} 条评论</span>
                        {post.isFeatured && (
                          <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[var(--color-accent)]">
                            已置顶
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">{post.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:max-w-[360px] lg:justify-end">
                      <button
                        type="button"
                        onClick={() => void handleFeaturedChange(post)}
                        disabled={!isPublished && !post.isFeatured}
                        className={`rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          post.isFeatured
                            ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)]"
                            : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        }`}
                      >
                        {post.isFeatured ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(post.id, isPublished ? "DRAFT" : "PUBLISHED")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          isPublished
                            ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)]"
                            : "bg-[var(--color-accent)] text-white"
                        }`}
                      >
                        {isPublished ? "撤回为草稿" : "立即发布"}
                      </button>
                      <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm">
                        编辑
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(post)}
                        className="rounded-full border border-[var(--color-rose)] bg-white px-4 py-2 text-sm text-[#b44a5a]"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPosts.length === 0 && (
              <p className="text-sm text-[var(--color-text)]">没有匹配的文章。</p>
            )}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <button
          type="button"
          onClick={() => setIsGuestbookOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">留言板管理</h2>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              共 {guestbookMessages.length} 条留言，包含公开留言和私密留言。
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm text-[var(--color-text)]">
            {isGuestbookOpen ? "收起" : "展开"}
          </span>
        </button>

        {isGuestbookOpen && (
          <div className="mt-5 grid gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={guestbookSearch}
                onChange={(event) => setGuestbookSearch(event.target.value)}
                placeholder="搜索昵称、留言、回复、公开或私密"
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none md:max-w-md"
              />
              <span className="text-sm text-[var(--color-text-faint)]">
                {message || `当前显示 ${filteredGuestbookMessages.length} 条`}
              </span>
            </div>

            {filteredGuestbookMessages.map((item) => {
              const replyValue = replyDrafts[item.id] || "";
              const remaining = maxReplyLength - replyValue.length;

              return (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-[var(--color-line)] bg-white/76 p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-2xl text-[var(--color-ink)]">{item.authorName}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            item.isPrivate
                              ? "bg-[#f6d6de] text-[#9c4053]"
                              : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          }`}
                        >
                          {item.isPrivate ? "私密留言" : "公开留言"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-faint)]">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-[var(--color-text)]">{item.content}</p>
                      {item.isPrivate && (
                        <p className="mt-3 text-xs leading-6 text-[#9c4053]">
                          这条留言不会在前台展示，访客无法在前台看到回复。
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={replyValue}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({
                            ...current,
                            [item.id]: event.target.value.slice(0, maxReplyLength),
                          }))
                        }
                        maxLength={maxReplyLength}
                        placeholder="回复这条留言，最多 100 字"
                        className="min-h-[120px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            remaining < 10 ? "text-xs text-[#b44a5a]" : "text-xs text-[var(--color-text-faint)]"
                          }
                        >
                          还可输入 {remaining} 字
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleReply(item.id)}
                          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white"
                        >
                          保存回复
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGuestbookMessages.length === 0 && (
              <p className="text-sm text-[var(--color-text)]">没有匹配的留言。</p>
            )}
          </div>
        )}
      </SurfaceCard>
    </main>
  );
}
