"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, PostRecord } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";
import { AdminPostForm } from "@/components/admin-post-form";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    apiFetch<PostRecord[]>("/api/posts?includeDrafts=true").then((posts) => {
      const matched = posts.find((item) => String(item.id) === params.id);
      if (!matched) {
        router.push("/admin");
        return;
      }
      setPost(matched);
    });
  }, [params.id, router, token]);

  if (!token || !post) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <SurfaceCard>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">编辑文章</h1>
        <p className="mt-3 text-sm text-[var(--color-text)]">
          每次保存都会重新执行 AI 内容审核，并刷新 AI 官方评论。
        </p>
        <div className="mt-8">
          <AdminPostForm token={token} mode="edit" initialPost={post} />
        </div>
      </SurfaceCard>
    </main>
  );
}
