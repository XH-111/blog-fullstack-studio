"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  return <AdminPostForm token={token} mode="create" />;
}
