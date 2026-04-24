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
            className="prose prose-slate mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </SurfaceCard>

        {post.aiReview && (
          <SurfaceCard>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">AI 内容审核建议</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["错别字", post.aiReview.typoIssues],
                ["语句通顺", post.aiReview.clarityIssues],
                ["逻辑结构", post.aiReview.logicIssues],
                ["知识准确", post.aiReview.knowledgeIssues],
                ["格式排版", post.aiReview.formatIssues],
                ["综合建议", post.aiReview.overallSuggestion],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[20px] border border-[var(--color-line)] bg-white/88 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}

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
                    {comment.isAi ? " · 官方 AI" : ""}
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
