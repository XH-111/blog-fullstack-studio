"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredAdminToken, setStoredAdminToken } from "@/lib/admin-auth";
import { SurfaceCard } from "@/components/surface-card";

type LoginResult = {
  token: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(getStoredAdminToken()));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredAdminToken();

    if (!token) {
      return;
    }

    apiFetch("/api/auth/me", { token })
      .then(() => router.replace("/admin"))
      .catch(() => setCheckingAuth(false));
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await apiFetch<LoginResult>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setStoredAdminToken(result.token);
      router.replace("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    setLoading(true);
    setMessage("");

    try {
      const result = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ username: resetUsername }),
      });
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "验证码发送失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          username: resetUsername,
          code: resetCode,
          newPassword,
        }),
      });
      setMode("login");
      setUsername(resetUsername);
      setPassword("");
      setResetCode("");
      setNewPassword("");
      setMessage("密码已重置，请使用新密码登录");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "密码重置失败");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16">
        <SurfaceCard className="w-full">
          <p className="text-sm text-[var(--color-text)]">正在检查登录状态...</p>
        </SurfaceCard>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16">
      <SurfaceCard className="w-full">
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">后台登录</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
          登录后可以管理文章、分类标签、留言板和首页设置。
        </p>

        <div className="mt-6 flex rounded-[18px] border border-[var(--color-line)] bg-white/70 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`flex-1 rounded-[14px] px-4 py-2 ${
              mode === "login" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text)]"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setMessage("");
              setResetUsername(username);
            }}
            className={`flex-1 rounded-[14px] px-4 py-2 ${
              mode === "forgot" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text)]"
            }`}
          >
            忘记密码
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="用户名"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="密码"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "登录中..." : "进入后台"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <input
              value={resetUsername}
              onChange={(event) => setResetUsername(event.target.value)}
              autoComplete="username"
              placeholder="用户名"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={loading || !resetUsername.trim()}
              className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm disabled:opacity-60"
            >
              发送邮箱验证码
            </button>
            <input
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="6 位验证码"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="新密码，至少 8 位"
              className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "重置中..." : "重置密码"}
              </button>
            </div>
          </form>
        )}
      </SurfaceCard>
    </main>
  );
}
