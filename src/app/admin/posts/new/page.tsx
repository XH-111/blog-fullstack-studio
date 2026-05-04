"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPostForm } from "@/components/admin-post-form";
import { getStoredAdminToken } from "@/lib/admin-auth";

export default function NewPostPage() {
  const router = useRouter();
  const [token] = useState(() => getStoredAdminToken());

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
