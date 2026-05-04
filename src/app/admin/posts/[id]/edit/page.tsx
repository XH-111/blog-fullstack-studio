"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, PostRecord } from "@/lib/api";
import { getStoredAdminToken } from "@/lib/admin-auth";
import { AdminPostForm } from "@/components/admin-post-form";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [token] = useState(() => getStoredAdminToken());

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

  return <AdminPostForm token={token} mode="edit" initialPost={post} />;
}
