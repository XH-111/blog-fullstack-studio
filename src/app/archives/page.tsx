"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, PostRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

type ArchiveGroup = {
  month: string;
  posts: PostRecord[];
};

export default function ArchivesPage() {
  const [groups, setGroups] = useState<ArchiveGroup[]>([]);

  useEffect(() => {
    apiFetch<PostRecord[]>("/api/posts").then((posts) => {
      const archiveMap = new Map<string, PostRecord[]>();

      for (const post of posts) {
        const key = (post.publishedAt || post.createdAt).slice(0, 7);
        const current = archiveMap.get(key) || [];
        current.push(post);
        archiveMap.set(key, current);
      }

      setGroups(
        Array.from(archiveMap.entries()).map(([month, groupedPosts]) => ({
          month,
          posts: groupedPosts,
        }))
      );
    });
  }, []);

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="时间归档"
        description="按月份查看文章沉淀"
        image="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="relative z-10 mx-auto -mt-8 flex w-full max-w-5xl flex-col gap-6 px-4">
        {groups.map((group) => (
          <SurfaceCard key={group.month}>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">{group.month}</h2>
            <div className="mt-5 space-y-3">
              {group.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3"
                >
                  <span className="text-sm text-[var(--color-ink)]">{post.title}</span>
                  <span className="text-xs text-[var(--color-text-faint)]">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </main>
  );
}
