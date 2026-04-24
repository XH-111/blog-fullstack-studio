"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, PostRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";
import { CommentForm } from "@/components/comment-form";

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    apiFetch<PostRecord>(`/api/posts/${params.slug}`)
      .then((result) => {
        if (alive) {
          setPost(result);
          setError("");
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "文章加载失败");
        }
      });

    return () => {
      alive = false;
    };
  }, [params.slug]);

  async function reloadPost() {
    try {
      const result = await apiFetch<PostRecord>(`/api/posts/${params.slug}`);
      setPost(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "文章加载失败");
    }
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <SurfaceCard>{error}</SurfaceCard>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <SurfaceCard>文章加载中...</SurfaceCard>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title={post.title}
        description={post.excerpt}
        image={
          post.coverImage ||
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80"
        }
      />

      <section className="relative z-10 mx-auto -mt-8 w-full max-w-5xl space-y-6 px-4">
        <SurfaceCard>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-faint)]">
            <span>{post.category.name}</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleString("zh-CN")
                : "草稿"}
            </span>
            <span>{post.viewCount} 次阅读</span>
          </div>
          <div
            className="prose prose-slate mt-8 max-w-none [&_img]:h-auto [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">评论区</h2>
          <div className="mt-6 space-y-4">
            {post.comments?.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[20px] border border-[var(--color-line)] bg-white/88 p-4"
              >
                <div className="flex items-center justify-between gap-4 text-sm">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {comment.authorName}
                    {comment.isAi ? " · AI 正确性评论" : ""}
                  </p>
                  <p className="text-[var(--color-text-faint)]">
                    #{comment.floor} · {new Date(comment.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <CommentForm postId={post.id} onSubmitted={reloadPost} />
          </div>
        </SurfaceCard>
      </section>
    </main>
  );
}
