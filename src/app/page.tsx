"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  CategoryRecord,
  PostRecord,
  SiteSettingsRecord,
} from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";
import { pastelChips } from "@/lib/theme";

const featureLabels = [
  "极简高级",
  "后台写作",
  "分类管理",
  "Markdown 编辑",
  "AI 审核",
  "JVM 专栏",
];

const fallbackSettings: SiteSettingsRecord = {
  id: "site",
  siteTitle: "POETIZE",
  heroTitle: "生活与技术的温柔归档",
  heroDescription:
    "长期记录 Java、JVM、工程实践与个人项目，把技术写成可以反复回看的作品。",
  heroImage:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
  profileName: "何晨旭",
  profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
  profileImage:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  updatedAt: new Date().toISOString(),
};

function getProfileInitials(name: string) {
  const cleaned = name.replace(/\s+/g, "");
  return cleaned.slice(0, 2).toUpperCase() || "HX";
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [settings, setSettings] = useState<SiteSettingsRecord>(fallbackSettings);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<PostRecord[]>("/api/posts"),
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<SiteSettingsRecord>("/api/settings"),
    ])
      .then(([postList, categoryList, settingsRecord]) => {
        setPosts(postList);
        setCategories(categoryList);
        setSettings(settingsRecord);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) {
      return posts;
    }

    return posts.filter((post) =>
      [post.title, post.excerpt, post.category.name]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  }, [posts, search]);

  const totalViews = posts.reduce((sum, item) => sum + item.viewCount, 0);
  const featuredCategories = categories.slice(0, 6);

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
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      {posts.length}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      文章
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      {categories.length}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      分类
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      {totalViews}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                      阅读
                    </p>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                搜索
              </p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索文章、分类或关键词"
                className="mt-4 w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
              />
              <Link
                href={`/search?q=${encodeURIComponent(search)}`}
                className="mt-4 inline-flex rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
              >
                进入搜索页
              </Link>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                  分类
                </p>
                <Link
                  href="/admin/taxonomies"
                  className="text-xs text-[var(--color-text-faint)] transition hover:text-[var(--color-accent)]"
                >
                  后台管理
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {featuredCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="flex items-center justify-between rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm text-[var(--color-text)] transition hover:-translate-y-0.5"
                  >
                    <span>{category.name}</span>
                    <span className="text-[var(--color-text-faint)]">
                      {category._count?.posts || 0}
                    </span>
                  </Link>
                ))}
              </div>
            </SurfaceCard>
          </aside>

          <div className="space-y-6">
            <SurfaceCard>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
                    欢迎光临
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">
                    一套可以长期写作、持续扩展、适合沉淀技术与生活的个人博客
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text)]">
                    这里会持续更新 Java、JVM、后端工程实践、项目复盘和个人成长记录。
                    我更希望这不是一个只展示结果的站点，而是一份长期可读的个人工程档案。
                  </p>
                </div>
                <Link
                  href="/archives"
                  className="rounded-full bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]"
                >
                  查看归档
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {featureLabels.map((label, index) => (
                  <span
                    key={label}
                    className="rounded-full px-4 py-2 text-xs font-medium text-[var(--color-ink)]"
                    style={{ backgroundColor: pastelChips[index % pastelChips.length] }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </SurfaceCard>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-white/92 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <div
                    className="h-40 w-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${
                        post.coverImage ||
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"
                      })`,
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
                    <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
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
          </div>
        </div>
      </section>
    </main>
  );
}
