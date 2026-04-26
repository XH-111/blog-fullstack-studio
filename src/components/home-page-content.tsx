"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  CategoryRecord,
  HomeReactionRecord,
  PostRecord,
  SiteSettingsRecord,
} from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";
import { resolveCoverImage } from "@/lib/cover-image";
import { pastelChips } from "@/lib/theme";

type HomePageContentProps = {
  posts: PostRecord[];
  categories: CategoryRecord[];
  settings: SiteSettingsRecord;
  reaction: HomeReactionRecord;
  guestbookCount: number;
};

function getProfileInitials(name: string) {
  const cleaned = name.replace(/\s+/g, "");
  return cleaned.slice(0, 2).toUpperCase() || "HX";
}

function splitWelcomeTags(value: string) {
  return value
    .split(/[,\n，、；;]/)
    .map((label) => label.trim())
    .filter(Boolean);
}

function chunkPosts(posts: PostRecord[], size: number) {
  const pages: PostRecord[][] = [];
  for (let index = 0; index < posts.length; index += size) {
    pages.push(posts.slice(index, index + size));
  }
  return pages;
}

export function HomePageContent({
  posts,
  categories: _categories,
  settings,
  reaction,
}: HomePageContentProps) {
  const [reactionState, setReactionState] = useState(reaction);
  const [bubbleTag, setBubbleTag] = useState("");
  const [isReacting, setIsReacting] = useState(false);
  const [featuredPage, setFeaturedPage] = useState(0);

  const welcomeTags = splitWelcomeTags(settings.welcomeTags);
  const featuredPosts = useMemo(
    () => posts.filter((post) => post.status === "PUBLISHED" && post.isFeatured),
    [posts]
  );
  const featuredPages = useMemo(() => chunkPosts(featuredPosts, 3), [featuredPosts]);
  const currentFeaturedPosts = featuredPages[featuredPage] || [];
  const totalLikes = useMemo(
    () => posts.reduce((sum, post) => sum + post.likeCount, 0),
    [posts]
  );
  const totalViews = useMemo(
    () => posts.reduce((sum, post) => sum + post.viewCount, 0),
    [posts]
  );

  const topTags = Object.entries(reactionState.tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const maxTagCount = Math.max(...topTags.map(([, count]) => count), 1);

  async function handleTagClick(tag: string) {
    if (isReacting) {
      return;
    }

    setBubbleTag(tag);
    setIsReacting(true);

    try {
      const updated = await apiFetch<HomeReactionRecord>("/api/home-reactions", {
        method: "POST",
        body: JSON.stringify({ tag }),
      });
      setReactionState(updated);
    } finally {
      setIsReacting(false);
      window.setTimeout(() => {
        setBubbleTag((current) => (current === tag ? "" : current));
      }, 1800);
    }
  }

  function goPrevFeatured() {
    setFeaturedPage((current) =>
      current === 0 ? Math.max(featuredPages.length - 1, 0) : current - 1
    );
  }

  function goNextFeatured() {
    setFeaturedPage((current) =>
      current >= featuredPages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title={settings.heroTitle}
        description={settings.heroDescription}
        image={settings.heroImage || undefined}
      />

      <section className="relative z-10 mx-auto -mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <SurfaceCard className="overflow-hidden bg-[linear-gradient(180deg,rgba(185,231,243,0.92),rgba(255,255,255,0.94))]">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-[6px] border-white/80 bg-white shadow-[0_16px_40px_rgba(76,144,149,0.18)]">
                  {settings.profileImage ? (
                    <div
                      aria-label={settings.profileName}
                      title={settings.profileName}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${settings.profileImage})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--color-accent-soft)] text-3xl font-semibold text-[var(--color-accent)]">
                      {getProfileInitials(settings.profileName)}
                    </div>
                  )}
                </div>
                <h2 className="mt-5 font-serif text-3xl text-[var(--color-ink)]">
                  {settings.siteTitle}
                </h2>
                <p className="mt-3 text-base font-medium text-[var(--color-ink)]">
                  {settings.profileName}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                  {settings.profileTagline}
                </p>

                <div className="mt-6 grid w-full grid-cols-3 gap-3 rounded-[22px] bg-white/72 p-4 text-center">
                  <Link
                    href="/knowledge"
                    className="rounded-[16px] px-2 py-1 transition hover:bg-white/70"
                  >
                    <p className="text-lg font-semibold text-[var(--color-ink)]">{posts.length}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      文章
                    </p>
                    <span className="mx-auto mt-1 block h-px w-8 rounded-full bg-[var(--color-accent)]/60" />
                  </Link>
                  <div className="rounded-[16px] px-2 py-1">
                    <p className="text-lg font-semibold text-[var(--color-ink)]">{totalLikes}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      点赞
                    </p>
                  </div>
                  <div className="rounded-[16px] px-2 py-1">
                    <p className="text-lg font-semibold text-[var(--color-ink)]">{totalViews}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      阅读
                    </p>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            {welcomeTags.length > 0 && (
              <SurfaceCard>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">点赞</p>
                <div className="mt-4 rounded-[24px] bg-white/74 p-5 text-center">
                  <p className="font-serif text-5xl text-[var(--color-ink)]">{reactionState.total}</p>
                  <p className="mt-2 text-sm text-[var(--color-text-faint)]">
                    主包收到的认可
                  </p>
                </div>
                <div className="mt-5 space-y-4">
                  {topTags.map(([tag, count], index) => {
                    const progress = Math.max(12, Math.round((count / maxTagCount) * 100));
                    const color = pastelChips[index % pastelChips.length];

                    return (
                      <div key={tag} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm text-[var(--color-text)]">
                          <span className="font-medium text-[var(--color-ink)]">{tag}</span>
                          <span className="text-[var(--color-text-faint)]">{count}</span>
                        </div>
                        <div
                          className="race-track"
                          style={
                            {
                              "--race-progress": `${progress}%`,
                              "--race-color": color,
                            } as React.CSSProperties
                          }
                        >
                          <div className="race-track-fill" />
                          <div className="race-car" aria-hidden="true">
                            <span className="race-car-body" />
                            <span className="race-car-wheel race-car-wheel-left" />
                            <span className="race-car-wheel race-car-wheel-right" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topTags.length === 0 && (
                    <p className="rounded-[16px] border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm text-[var(--color-text-faint)]">
                      点击右侧标签，为主包点个赞。
                    </p>
                  )}
                </div>
              </SurfaceCard>
            )}
          </aside>

          <div className="space-y-6">
            <SurfaceCard>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  {settings.welcomeEyebrow}
                </p>
                <h2 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">
                  {settings.welcomeTitle}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text)]">
                  {settings.welcomeBody}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {welcomeTags.map((label, index) => (
                  <span key={`${label}-${index}`} className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => void handleTagClick(label)}
                      className="rounded-full px-4 py-2 text-xs font-medium text-[var(--color-ink)] transition hover:-translate-y-0.5 disabled:opacity-70"
                      style={{ backgroundColor: pastelChips[index % pastelChips.length] }}
                      disabled={isReacting}
                    >
                      {label}
                    </button>
                    {bubbleTag === label && (
                      <span className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-[16px] bg-[var(--color-ink)] px-4 py-2 text-xs leading-5 text-white shadow-[0_16px_40px_rgba(23,37,51,0.18)]">
                        {label}的主包得到了你的认可
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </SurfaceCard>

            {featuredPosts.length > 0 && (
              <SurfaceCard>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                      Featured
                    </p>
                    <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
                      {settings.featuredTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                      {settings.featuredDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {featuredPages.length > 1 && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={goPrevFeatured}
                          className="featured-nav-button"
                          aria-label="上一组置顶文章"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12.5 4.5L7 10l5.5 5.5" />
                          </svg>
                        </button>
                        <span className="min-w-[46px] text-center text-xs font-medium tracking-[0.2em] text-[var(--color-text-faint)]">
                          {featuredPage + 1} / {featuredPages.length}
                        </span>
                        <button
                          type="button"
                          onClick={goNextFeatured}
                          className="featured-nav-button"
                          aria-label="下一组置顶文章"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M7.5 4.5L13 10l-5.5 5.5" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <Link
                      href="/knowledge"
                      className="rounded-full bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]"
                    >
                      进入知识库
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {currentFeaturedPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.slug}`}
                      className="group overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-white/92 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1.5"
                    >
                      <div
                        className="featured-cover featured-cover-home h-44 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                        style={{
                          backgroundImage: `url(${resolveCoverImage(post.coverImage)})`,
                        }}
                      />
                      <div className="p-5">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
                          style={{ backgroundColor: pastelChips[index % pastelChips.length] }}
                        >
                          {post.category.name}
                        </span>
                        <h3 className="mt-4 font-serif text-2xl leading-tight text-[var(--color-ink)]">
                          {post.title}
                        </h3>
                        <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--color-text)]">
                          {post.excerpt}
                        </p>
                        <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-text-faint)]">
                          <span>
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                              : "未发布"}
                          </span>
                          <span>{post.commentCount} 条评论</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
