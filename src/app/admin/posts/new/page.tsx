"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SurfaceCard } from "@/components/surface-card";
import { AdminPostForm } from "@/components/admin-post-form";

export default function NewPostPage() {
  const router = useRouter();
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
    }
  }, [router, token]);

  if (!token) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <SurfaceCard>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">新建文章</h1>
        <p className="mt-3 text-sm text-[var(--color-text)]">
          保存或发布后，会自动触发 AI 内容审核和 AI 官方评论生成。你也可以先存成草稿，稍后再补充。
        </p>
        <div className="mt-8">
          <AdminPostForm token={token} mode="create" />
        </div>
      </SurfaceCard>
    </main>
  );
}
