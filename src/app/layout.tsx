import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poetize Studio",
  description: "高颜值个人博客全站项目，支持后台管理、评论系统、AI 审核与 AI 官方评论。",
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/search", label: "搜索" },
  { href: "/archives", label: "归档" },
  { href: "/about", label: "关于我" },
  { href: "/admin/login", label: "后台登录" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 border-b border-white/45 bg-[rgba(248,251,255,0.8)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="font-serif text-3xl tracking-tight text-[var(--color-ink)]"
              >
                POETIZE
              </Link>
              <nav className="hidden items-center gap-6 text-sm text-[var(--color-text)] md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-[var(--color-ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="rounded-full border border-[var(--color-line)] bg-white/78 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Blog System
              </div>
            </div>
            <div className="flex flex-wrap gap-4 border-t border-white/35 px-4 py-3 text-sm text-[var(--color-text)] md:hidden sm:px-6 lg:px-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
