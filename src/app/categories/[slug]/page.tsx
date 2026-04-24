"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, CategoryRecord, PostRecord } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [category, setCategory] = useState<CategoryRecord | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<PostRecord[]>(`/api/posts?category=${params.slug}`),
      apiFetch<CategoryRecord[]>("/api/categories"),
    ]).then(([postList, categoryList]) => {
      setPosts(postList);
      setCategory(categoryList.find((item) => item.slug === params.slug) || null);
    });
  }, [params.slug]);

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title={category?.name || "分类"}
        description="按分类查看文章"
        image="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="relative z-10 mx-auto -mt-8 grid w-full max-w-6xl gap-5 px-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`}>
            <SurfaceCard className="h-full">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {post.category.name}
              </p>
              <h2 className="mt-3 font-serif text-2xl text-[var(--color-ink)]">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
                {post.excerpt}
              </p>
            </SurfaceCard>
          </Link>
        ))}
      </section>
    </main>
  );
}
