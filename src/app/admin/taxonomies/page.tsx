"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, CategoryRecord, TagRecord } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";

export default function TaxonomiesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );

  async function loadMeta() {
    const [categoryList, tagList] = await Promise.all([
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<TagRecord[]>("/api/tags"),
    ]);
    setCategories(categoryList);
    setTags(tagList);
  }

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    let alive = true;

    Promise.all([
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<TagRecord[]>("/api/tags"),
    ])
      .then(([categoryList, tagList]) => {
        if (!alive) {
          return;
        }
        setCategories(categoryList);
        setTags(tagList);
      })
      .catch((error) => {
        if (!alive) {
          return;
        }
        setMessage(error instanceof Error ? error.message : "加载分类与标签失败");
      });

    return () => {
      alive = false;
    };
  }, [router, token]);

  async function handleCreateCategory(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        token,
        body: JSON.stringify({ name: newCategory }),
      });
      setNewCategory("");
      setMessage("分类已创建");
      await loadMeta();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建分类失败");
    }
  }

  async function handleCreateTag(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await apiFetch("/api/tags", {
        method: "POST",
        token,
        body: JSON.stringify({ name: newTag }),
      });
      setNewTag("");
      setMessage("标签已创建");
      await loadMeta();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建标签失败");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">分类与标签管理</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          在这里维护文章的分类体系和标签体系。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard>
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">新增分类</h2>
          <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="输入分类名"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              创建分类
            </button>
          </form>
          <div className="mt-6 space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm"
              >
                {category.name}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">新增标签</h2>
          <form onSubmit={handleCreateTag} className="mt-5 space-y-4">
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              placeholder="输入标签名"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              创建标签
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <p className="text-sm text-[var(--color-text-faint)]">{message}</p>
    </main>
  );
}
