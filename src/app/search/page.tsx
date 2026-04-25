"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, PostRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

function SearchContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const [posts, setPosts] = useState<PostRecord[]>([]);

  useEffect(() => {
    const query = keyword.trim();
    const path = query ? `/api/posts?search=${encodeURIComponent(query)}` : "/api/posts";
    apiFetch<PostRecord[]>(path).then(setPosts).catch(console.error);
  }, [keyword]);

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="站内搜索"
        description={keyword ? `当前关键词：${keyword}` : "输入关键词快速查找文章"}
        image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="relative z-10 mx-auto -mt-8 flex w-full max-w-5xl flex-col gap-6 px-4">
        <SurfaceCard>
          <p className="text-sm text-[var(--color-text)]">
            共找到 <strong>{posts.length}</strong> 篇相关文章。
          </p>
        </SurfaceCard>
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`}>
            <SurfaceCard>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {post.category.name}
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">{post.excerpt}</p>
            </SurfaceCard>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <SurfaceCard>搜索页加载中...</SurfaceCard>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
