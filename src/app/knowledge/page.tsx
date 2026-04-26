"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, CategoryRecord, PostRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";
import { resolveCoverImage } from "@/lib/cover-image";
import { pastelChips } from "@/lib/theme";

type SortMode = "time" | "likes" | "comments";

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "time", label: "按时间排序" },
  { value: "likes", label: "按点赞数排序" },
  { value: "comments", label: "按评论数排序" },
];

function exactTimestamp(post: PostRecord) {
  const source = post.publishedAt || post.createdAt;
  const timestamp = source ? Date.parse(source) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function KnowledgePage() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("time");

  useEffect(() => {
    Promise.all([
      apiFetch<PostRecord[]>("/api/posts"),
      apiFetch<CategoryRecord[]>("/api/categories"),
    ])
      .then(([postList, categoryList]) => {
        setPosts(postList);
        setCategories(categoryList);
      })
      .catch(console.error);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return posts
      .filter((post) => {
        const matchesCategory =
          activeCategory === "all" || post.category.slug === activeCategory;
        const matchesKeyword =
          !normalizedKeyword ||
          [post.title, post.excerpt, post.category.name, ...post.tags.map((tag) => tag.name)]
            .join(" ")
            .toLowerCase()
            .includes(normalizedKeyword);

        return matchesCategory && matchesKeyword;
      })
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }

        const aTime = exactTimestamp(a);
        const bTime = exactTimestamp(b);

        if (sortMode === "likes") {
          return b.likeCount - a.likeCount || bTime - aTime;
        }

        if (sortMode === "comments") {
          return b.commentCount - a.commentCount || bTime - aTime;
        }

        return bTime - aTime;
      });
  }, [activeCategory, keyword, posts, sortMode]);

  const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);
  const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="知识库"
        description="把技术文章、项目复盘和学习笔记集中放在这里，首页保持轻量。"
        image="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="relative z-10 mx-auto -mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Library
              </p>
              <h1 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">内容索引</h1>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-[18px] bg-white/74 p-3">
                  <p className="font-serif text-2xl text-[var(--color-ink)]">{posts.length}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-faint)]">文章</p>
                </div>
                <div className="rounded-[18px] bg-white/74 p-3">
                  <p className="font-serif text-2xl text-[var(--color-ink)]">{totalViews}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-faint)]">阅读</p>
                </div>
                <div className="rounded-[18px] bg-white/74 p-3">
                  <p className="font-serif text-2xl text-[var(--color-ink)]">{totalLikes}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-faint)]">点赞</p>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Search
              </p>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题、摘要、标签"
                className="mt-4 w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
              />
            </SurfaceCard>

            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Sort
              </p>
              <div className="mt-4 grid gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortMode(option.value)}
                    className={`rounded-[18px] border px-4 py-3 text-left text-sm ${
                      sortMode === option.value
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-line)] bg-white/88 text-[var(--color-text)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Categories
              </p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-sm ${
                    activeCategory === "all"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-line)] bg-white/88 text-[var(--color-text)]"
                  }`}
                >
                  <span>全部内容</span>
                  <span>{posts.length}</span>
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.slug)}
                    className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-sm ${
                      activeCategory === category.slug
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-line)] bg-white/88 text-[var(--color-text)]"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span>{category._count?.posts || 0}</span>
                  </button>
                ))}
              </div>
            </SurfaceCard>
          </aside>

          <div className="space-y-6">
            <SurfaceCard>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Knowledge Base
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">
                    技术文章与项目沉淀
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text)]">
                    这里集中展示所有文章。可以按分类筛选，也可以按完整发布时间、点赞数或评论数排序。
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
                  当前 {filteredPosts.length} 篇
                </span>
              </div>
            </SurfaceCard>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="group overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-white/92 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <div className="relative overflow-hidden">
                    {post.isFeatured && (
                      <div className="featured-stamp">
                        <span className="featured-stamp__ring">
                          <span className="featured-stamp__text">主播推荐</span>
                        </span>
                      </div>
                    )}
                    <div
                      className={`h-44 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03] ${
                        post.isFeatured ? "featured-cover featured-cover-library" : ""
                      }`}
                      style={{
                        backgroundImage: `url(${resolveCoverImage(post.coverImage)})`,
                      }}
                    />
                  </div>
                  <div className="p-5">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
                      style={{
                        backgroundColor: pastelChips[index % pastelChips.length],
                      }}
                    >
                      {post.category.name}
                    </span>
                    <h3 className="mt-4 font-serif text-2xl leading-tight text-[var(--color-ink)]">
                      {post.title}
                    </h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--color-text)]">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[var(--color-text-faint)]">
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleString("zh-CN")
                          : "未发布"}
                      </span>
                      <span>
                        {post.likeCount} 赞 · {post.commentCount} 评论
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <SurfaceCard>
                <p className="text-sm text-[var(--color-text)]">没有找到匹配的文章。</p>
              </SurfaceCard>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
