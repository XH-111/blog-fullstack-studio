"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, PostRecord } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";

type Summary = {
  postCount: number;
  commentCount: number;
  categoryCount: number;
  tagCount: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    Promise.all([
      apiFetch<PostRecord[]>("/api/posts?includeDrafts=true"),
      apiFetch<Summary>("/api/dashboard/summary", { token }),
    ])
      .then(([postList, summaryData]) => {
        setPosts(postList);
        setSummary(summaryData);
      })
      .catch(() => router.push("/admin/login"));
  }, [router, token]);

  async function handleDelete(postId: number) {
    if (!token) {
      return;
    }

    await apiFetch(`/api/posts/${postId}`, {
      method: "DELETE",
      token,
    });
    setPosts((current) => current.filter((item) => item.id !== postId));
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[var(--color-ink)]">内容后台</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            在这里管理文章、分类、标签和首页图片。发布和撤回可以直接在列表里操作；AI 审核功能已经移除。
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

      <div className="grid gap-5">
        {posts.map((post) => {
          const isPublished = post.status === "PUBLISHED";

          return (
            <SurfaceCard key={post.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-faint)]">
                    <span>{post.category.name}</span>
                    <span>{isPublished ? "已发布" : "草稿"}</span>
                    <span>{post.commentCount} 条评论</span>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">{post.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">{post.excerpt}</p>
                  {post.aiOfficialComment && (
                    <div className="mt-4 rounded-[20px] bg-[var(--color-panel-soft)] p-4 text-sm leading-7 text-[var(--color-text)]">
                      <p className="font-semibold text-[var(--color-ink)]">AI 正确性评论</p>
                      <p className="mt-2">{post.aiOfficialComment.content}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 lg:max-w-[280px] lg:justify-end">
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
                    onClick={() => void handleDelete(post.id)}
                    className="rounded-full border border-[var(--color-rose)] bg-white px-4 py-2 text-sm text-[#b44a5a]"
                  >
                    删除
                  </button>
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </main>
  );
}
