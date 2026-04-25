"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123456");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("blog_admin_token", result.token);
      router.push("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16">
      <SurfaceCard className="w-full">
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">后台登录</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
          登录后可以管理文章、分类标签和首页视觉设置。
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {loading ? "登录中..." : "进入后台"}
            </button>
          </div>
        </form>
      </SurfaceCard>
    </main>
  );
}
