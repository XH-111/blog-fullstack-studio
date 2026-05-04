"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, CommentRecord, normalizeRenderedHtml, PostRecord } from "@/lib/api";
import { resolveCoverImage } from "@/lib/cover-image";
import { CommentForm } from "@/components/comment-form";

type CommentTreeNode = CommentRecord & {
  replies: CommentTreeNode[];
};

function buildCommentTree(comments: CommentRecord[]) {
  const nodeMap = new Map<number, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  comments.forEach((comment) => {
    nodeMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const node = nodeMap.get(comment.id);

    if (!node) {
      return;
    }

    if (comment.parentId) {
      const parent = nodeMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(node);
        return;
      }
    }

    roots.push(node);
  });

  return roots;
}

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CommentRecord | null>(null);

  useEffect(() => {
    let alive = true;

    apiFetch<PostRecord>(`/api/posts/${params.slug}`)
      .then((result) => {
        if (alive) {
          setPost(result);
          setError("");
          setHasLiked(
            typeof window !== "undefined" &&
              localStorage.getItem(`liked_post_${result.id}`) === "true"
          );
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

  useEffect(() => {
    if (!post || typeof window === "undefined") {
      return;
    }

    const viewKey = `viewed_post_${post.id}`;
    if (sessionStorage.getItem(viewKey) === "true") {
      return;
    }

    sessionStorage.setItem(viewKey, "true");

    apiFetch<{ id: number; viewCount: number }>(`/api/posts/${post.id}/view`, {
      method: "PATCH",
    })
      .then((result) => {
        setPost((current) =>
          current && current.id === result.id
            ? { ...current, viewCount: result.viewCount }
            : current
        );
      })
      .catch(() => {
        sessionStorage.removeItem(viewKey);
      });
  }, [post]);

  const commentTree = useMemo(
    () => buildCommentTree(post?.comments || []),
    [post?.comments]
  );

  function renderComment(nodes: CommentTreeNode[], depth = 0): ReactNode {
    return nodes.map((comment) => (
      <div
        key={comment.id}
        className={`rounded-[22px] border border-[var(--color-line)] bg-white/78 p-4 ${
          depth > 0 ? "mt-4 ml-4 md:ml-8" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="font-semibold text-[var(--color-ink)]">
            {comment.authorName}
            {comment.isAdmin ? " · 站长" : ""}
            {comment.isAi ? " · AI 正确性评论" : ""}
          </p>
          <p className="text-[var(--color-text-faint)]">#{comment.floor}</p>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-faint)]">
          {new Date(comment.createdAt).toLocaleString("zh-CN")}
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">{comment.content}</p>
        {!comment.isAi && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setReplyTarget(comment)}
              className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-xs text-[var(--color-text)]"
            >
              回复
            </button>
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-4">{renderComment(comment.replies, depth + 1)}</div>
        )}
      </div>
    ));
  }

  async function handleLike() {
    if (!post || isLiking || hasLiked) {
      return;
    }

    setIsLiking(true);
    try {
      const result = await apiFetch<{ id: number; likeCount: number }>(
        `/api/posts/${post.id}/like`,
        { method: "PATCH" }
      );
      setPost((current) =>
        current ? { ...current, likeCount: result.likeCount } : current
      );
      localStorage.setItem(`liked_post_${post.id}`, "true");
      setHasLiked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "点赞失败");
    } finally {
      setIsLiking(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f3ef] px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-[26px] border border-white/70 bg-white/75 p-8 text-[var(--color-text)] shadow-[var(--shadow-card)]">
          {error}
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#f7f3ef] px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-[26px] border border-white/70 bg-white/75 p-8 text-[var(--color-text)] shadow-[var(--shadow-card)]">
          文章加载中...
        </div>
      </main>
    );
  }

  const contentHtml = normalizeRenderedHtml(post.contentHtml);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7e7ef_0%,#e9f4f5_45%,#fbf2e6_100%)] pb-20">
      <section
        className="relative min-h-[520px] bg-cover bg-center px-4 pt-20"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(31,28,36,0.18), rgba(247,243,239,0.88)), url(${
            resolveCoverImage(post.coverImage)
          })`,
        }}
      >
        <div className="mx-auto flex min-h-[430px] max-w-6xl items-end">
          <div className="mb-8 w-full rounded-[34px] border border-white/55 bg-white/58 p-7 shadow-[0_30px_110px_rgba(67,48,82,0.20)] backdrop-blur-2xl md:p-10">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
              <span>{post.category.name}</span>
              <span className="h-1 w-1 rounded-full bg-current" />
              <span>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleString("zh-CN")
                  : "草稿"}
              </span>
              <span className="h-1 w-1 rounded-full bg-current" />
              <span>{post.viewCount} 次阅读</span>
              <span className="h-1 w-1 rounded-full bg-current" />
              <span>{post.likeCount} 赞</span>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-tight text-[var(--color-ink)] md:text-6xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--color-text)]">
              {post.excerpt}
            </p>
            {post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-white/70 bg-white/62 px-3 py-1 text-xs text-[var(--color-text)]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleLike()}
              disabled={isLiking || hasLiked}
              className="mt-6 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {hasLiked
                ? `已点赞 ${post.likeCount}`
                : isLiking
                  ? "点赞中..."
                  : `点赞 ${post.likeCount}`}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <article className="rounded-[30px] border border-white/70 bg-white/82 p-6 shadow-[0_22px_90px_rgba(67,48,82,0.12)] backdrop-blur-xl md:p-10">
          <div
            className="rich-post-content prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-[var(--color-ink)] prose-p:leading-8 prose-a:text-[var(--color-accent)] prose-ol:list-decimal prose-ol:pl-7 prose-li:pl-1 prose-li:my-1 prose-img:mx-auto prose-img:my-8 prose-img:h-auto prose-img:max-w-full prose-img:rounded-[22px] prose-blockquote:rounded-[20px] prose-blockquote:border-l-[6px] prose-blockquote:bg-[var(--color-panel-soft)] prose-blockquote:px-5 prose-blockquote:py-2 prose-pre:rounded-[22px] prose-pre:bg-[#0f172a] prose-pre:px-5 prose-pre:py-4 prose-pre:text-slate-100 prose-pre:shadow-none prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.92em] prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {post.aiOfficialComment && (
            <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                AI Correctness
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">
                正确性评论
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text)]">
                {post.aiOfficialComment.content}
              </p>
            </div>
          )}

          {post.aiInterview && (
            <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                AI Interview
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">
                面试板块
              </h2>
              <div
                className="rich-post-content mt-4 text-sm"
                dangerouslySetInnerHTML={{
                  __html: normalizeRenderedHtml(post.aiInterview.contentHtml),
                }}
              />
            </div>
          )}

          <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Comments
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">
              {post.commentCount} 条评论
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-faint)]">
              留下你的想法，评论会按楼层展示。
            </p>
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl px-4">
        <div className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_22px_90px_rgba(67,48,82,0.12)] backdrop-blur-xl md:p-8">
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">评论区</h2>
          <div className="mt-6 space-y-4">
            {commentTree.length > 0 ? (
              renderComment(commentTree)
            ) : (
              <div className="rounded-[22px] border border-[var(--color-line)] bg-white/78 p-4 text-sm text-[var(--color-text)]">
                还没有评论，来留下第一条吧。
              </div>
            )}
          </div>
          <div className="mt-8">
            <CommentForm
              postId={post.id}
              parentId={replyTarget?.id}
              replyToAuthor={replyTarget?.authorName}
              onCancelReply={() => setReplyTarget(null)}
              onSubmitted={async () => {
                await reloadPost();
                setReplyTarget(null);
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
