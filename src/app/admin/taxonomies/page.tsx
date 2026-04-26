"use client";

import { FormEvent, useEffect, useState } from "react";
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

  async function loadTaxonomies() {
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
        if (alive) {
          setMessage(error instanceof Error ? error.message : "加载分类和标签失败");
        }
      });

    return () => {
      alive = false;
    };
  }, [router, token]);

  async function handleCreateCategory(event: FormEvent) {
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
      await loadTaxonomies();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建分类失败");
    }
  }

  async function handleDeleteCategory(category: CategoryRecord) {
    const usageCount = category._count?.posts || 0;

    if (usageCount > 0) {
      setMessage("该分类下还有文章，暂时不能删除。请先调整相关文章分类。");
      return;
    }

    if (!window.confirm(`确认删除分类“${category.name}”吗？`)) {
      return;
    }

    setMessage("");

    try {
      await apiFetch(`/api/categories/${category.id}`, {
        method: "DELETE",
        token,
      });
      setMessage("分类已删除");
      await loadTaxonomies();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除分类失败");
    }
  }

  async function handleCreateTag(event: FormEvent) {
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
      await loadTaxonomies();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建标签失败");
    }
  }

  async function handleDeleteTag(tag: TagRecord) {
    const usageCount = tag._count?.postTags || 0;

    if (!window.confirm(`确认删除标签“${tag.name}”吗？已被文章使用的标签不能删除。`)) {
      return;
    }

    setMessage("");

    try {
      await apiFetch(`/api/tags/${tag.id}`, {
        method: "DELETE",
        token,
      });
      setMessage("标签已删除");
      await loadTaxonomies();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除标签失败");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">分类与标签管理</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          分类用于知识库文章归档；标签可在这里维护，也可以在文章编辑页中直接新增或删除。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard>
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">分类管理</h2>
          <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="例如：JVM 专栏、源码拆解、面试沉淀"
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
            {categories.map((category) => {
              const usageCount = category._count?.posts || 0;

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="text-[var(--color-ink)]">{category.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                      {usageCount} 篇文章
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCategory(category)}
                    disabled={usageCount > 0}
                    className="rounded-full border border-[var(--color-rose)] bg-white px-4 py-2 text-xs text-[#b44a5a] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    删除
                  </button>
                </div>
              );
            })}

            {categories.length === 0 && (
              <p className="rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm text-[var(--color-text-faint)]">
                还没有分类。
              </p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="font-serif text-3xl text-[var(--color-ink)]">标签管理</h2>
          <form onSubmit={handleCreateTag} className="mt-5 space-y-4">
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              placeholder="例如：Java、源码、项目复盘"
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

          <div className="mt-6 space-y-3">
            {tags.map((tag) => {
              const usageCount = tag._count?.postTags || 0;

              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="text-[var(--color-ink)]">{tag.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                      {usageCount} 篇文章使用
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTag(tag)}
                    disabled={usageCount > 0}
                    className="rounded-full border border-[var(--color-rose)] bg-white px-4 py-2 text-xs text-[#b44a5a] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    删除
                  </button>
                </div>
              );
            })}

            {tags.length === 0 && (
              <p className="rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm text-[var(--color-text-faint)]">
                还没有标签。
              </p>
            )}
          </div>
        </SurfaceCard>
      </div>

      <p className="text-sm text-[var(--color-text-faint)]">{message}</p>
    </main>
  );
}
