"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, CategoryRecord } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";

export default function TaxonomiesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );

  async function loadCategories() {
    const categoryList = await apiFetch<CategoryRecord[]>("/api/categories");
    setCategories(categoryList);
  }

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    let alive = true;

    apiFetch<CategoryRecord[]>("/api/categories")
      .then((categoryList) => {
        if (alive) {
          setCategories(categoryList);
        }
      })
      .catch((error) => {
        if (alive) {
          setMessage(error instanceof Error ? error.message : "加载分类失败");
        }
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
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建分类失败");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">分类管理</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          这里只保留文章分类。标签以后在文章编辑页里选择、新建或删除。
        </p>
      </div>

      <SurfaceCard>
        <h2 className="font-serif text-3xl text-[var(--color-ink)]">新增分类</h2>
        <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="例如：JVM 调优、源码拆读、面试总结"
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
              className="flex items-center justify-between rounded-[18px] border border-[var(--color-line)] bg-white/88 px-4 py-3 text-sm"
            >
              <span>{category.name}</span>
              <span className="text-[var(--color-text-faint)]">
                {category._count?.posts || 0} 篇
              </span>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <p className="text-sm text-[var(--color-text-faint)]">{message}</p>
    </main>
  );
}
