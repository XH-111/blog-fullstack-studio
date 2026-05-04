"use client";

import { ReactNode, SVGProps, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  GuestbookMessageRecord,
  NotificationRecord,
  PostRecord,
} from "@/lib/api";
import { clearStoredAdminToken, getStoredAdminToken } from "@/lib/admin-auth";
import { SurfaceCard } from "@/components/surface-card";

type Summary = {
  postCount: number;
  commentCount: number;
  categoryCount: number;
  tagCount: number;
  unreadNotificationCount: number;
  totalViewCount: number;
  totalLikeCount: number;
  todayPostCount: number;
  todayViewCount: number;
  todayLikeCount: number;
};

type NotificationsPayload = {
  unreadCount: number;
  notifications: NotificationRecord[];
};

const maxReplyLength = 100;
const notificationsPerPage = 5;

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function FileIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </BaseIcon>
  );
}

function GridIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </BaseIcon>
  );
}

function TagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 12l-8 8-8-8V4h8l8 8z" />
      <circle cx="9" cy="9" r="1.2" />
    </BaseIcon>
  );
}

function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </BaseIcon>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l7 3v6c0 4.6-3.1 8.8-7 10-3.9-1.2-7-5.4-7-10V6l7-3z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </BaseIcon>
  );
}

function PencilIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </BaseIcon>
  );
}

function MessageIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </BaseIcon>
  );
}

function MetricCard({
  label,
  value,
  dailyDelta = 0,
  icon,
  accentClass,
  badgeClass,
  iconClass,
}: {
  label: string;
  value: number;
  dailyDelta?: number;
  icon: ReactNode;
  accentClass: string;
  badgeClass: string;
  iconClass: string;
}) {
  return (
    <SurfaceCard className="overflow-hidden rounded-[26px] border-white/70 bg-white/86 p-0 shadow-[0_26px_54px_rgba(43,67,83,0.10)]">
      <div className="flex items-center justify-between gap-4 px-7 py-7">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
          {dailyDelta > 0 && (
            <div className="mt-2 flex min-h-5 items-center gap-2">
              <span className="text-xs text-[var(--color-text-faint)]">今日新增</span>
              <span className="rounded-full bg-[#f16f64] px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                +{dailyDelta}
              </span>
            </div>
          )}
          <p className={`mt-5 font-serif text-6xl leading-none ${iconClass}`}>{value}</p>
        </div>
        <div className={`flex h-16 w-16 items-center justify-center rounded-[18px] ${badgeClass}`}>
          {icon}
        </div>
      </div>
      <div className={`h-1.5 w-[56%] rounded-r-full ${accentClass}`} />
    </SurfaceCard>
  );
}

function DashboardPanel({
  icon,
  title,
  description,
  action,
  accentClass,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  accentClass: string;
  children?: ReactNode;
}) {
  return (
    <SurfaceCard className="overflow-hidden rounded-[30px] border-white/70 bg-white/88 p-0 shadow-[0_28px_64px_rgba(43,67,83,0.10)]">
      <div className="relative overflow-hidden px-7 py-7 lg:px-8">
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] rounded-l-[120px] opacity-90 lg:block ${accentClass}`}
        />
        <div className="pointer-events-none absolute right-10 top-8 hidden h-3 w-3 rounded-full bg-white/70 lg:block" />
        <div className="pointer-events-none absolute right-24 top-20 hidden h-2 w-2 rounded-full bg-white/80 lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(233,244,244,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {icon}
            </div>
            <div className="hidden h-16 w-px bg-[var(--color-line)] lg:block" />
            <div className="min-w-0">
              <h2 className="font-serif text-[2rem] leading-tight text-[var(--color-ink)]">{title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-faint)]">
                {description}
              </p>
            </div>
          </div>
          {action && <div className="relative z-10 flex shrink-0 items-center gap-3">{action}</div>}
        </div>
        {children && <div className="relative z-10 mt-7 border-t border-[var(--color-line)] pt-6">{children}</div>}
      </div>
    </SurfaceCard>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessageRecord[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [message, setMessage] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(true);
  const [isPostsOpen, setIsPostsOpen] = useState(false);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [guestbookSearch, setGuestbookSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [token] = useState(() => getStoredAdminToken());

  async function loadGuestbookMessages(currentToken = token) {
    const list = await apiFetch<GuestbookMessageRecord[]>("/api/guestbook/admin", {
      token: currentToken,
    });
    setGuestbookMessages(list);
    setReplyDrafts(Object.fromEntries(list.map((item) => [item.id, item.replyContent || ""])));
  }

  async function loadNotifications(currentToken = token) {
    const result = await apiFetch<NotificationsPayload>("/api/dashboard/notifications", {
      token: currentToken,
    });
    setNotifications(result.notifications);
    setUnreadNotificationCount(result.unreadCount);
    setNotificationPage(1);
  }

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    Promise.all([
      apiFetch<PostRecord[]>("/api/posts?includeDrafts=true"),
      apiFetch<Summary>("/api/dashboard/summary", { token }),
      apiFetch<GuestbookMessageRecord[]>("/api/guestbook/admin", { token }),
      apiFetch<NotificationsPayload>("/api/dashboard/notifications", { token }),
    ])
      .then(([postList, summaryData, guestbookList, notificationsResult]) => {
        setPosts(postList);
        setSummary(summaryData);
        setGuestbookMessages(guestbookList);
        setReplyDrafts(Object.fromEntries(guestbookList.map((item) => [item.id, item.replyContent || ""])));
        setNotifications(notificationsResult.notifications);
        setUnreadNotificationCount(notificationsResult.unreadCount);
        setNotificationPage(1);
      })
      .catch(() => router.push("/admin/login"));
  }, [router, token]);

  function handleLogout() {
    clearStoredAdminToken();
    router.replace("/admin/login");
  }

  async function handleReadNotification(notificationId: number) {
    if (!token) {
      return;
    }

    await apiFetch<NotificationRecord>(`/api/dashboard/notifications/${notificationId}/read`, {
      method: "PATCH",
      token,
    });
    await loadNotifications(token);
    setSummary((current) =>
      current
        ? {
            ...current,
            unreadNotificationCount: Math.max(0, current.unreadNotificationCount - 1),
          }
        : current
    );
  }

  async function handleReadAllNotifications() {
    if (!token) {
      return;
    }

    await apiFetch("/api/dashboard/notifications/read-all", {
      method: "PATCH",
      token,
    });

    await loadNotifications(token);
    setSummary((current) =>
      current
        ? {
            ...current,
            unreadNotificationCount: 0,
          }
        : current
    );
  }

  const filteredPosts = useMemo(() => {
    const keyword = postSearch.trim().toLowerCase();
    const matchedPosts = !keyword
      ? posts
      : posts.filter((post) =>
          [
            post.title,
            post.excerpt,
            post.contentText || "",
            post.contentMarkdown || "",
            post.category.name,
            post.status === "PUBLISHED" ? "已发布" : "草稿",
            post.isFeatured ? "置顶 featured" : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        );

    return [...matchedPosts].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      const aTime = Date.parse(a.publishedAt || a.updatedAt || a.createdAt);
      const bTime = Date.parse(b.publishedAt || b.updatedAt || b.createdAt);
      return bTime - aTime;
    });
  }, [postSearch, posts]);

  const filteredGuestbookMessages = useMemo(() => {
    const keyword = guestbookSearch.trim().toLowerCase();
    if (!keyword) {
      return guestbookMessages;
    }

    return guestbookMessages.filter((item) => {
      const searchable = [
        item.authorName,
        item.content,
        item.replyContent || "",
        item.isPrivate ? "私密留言 private" : "公开留言 public",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }, [guestbookMessages, guestbookSearch]);

  const featuredPostCount = posts.filter((post) => post.isFeatured).length;
  const notificationPageCount = Math.max(1, Math.ceil(notifications.length / notificationsPerPage));
  const pagedNotifications = notifications.slice(
    (notificationPage - 1) * notificationsPerPage,
    notificationPage * notificationsPerPage
  );

  async function handleDelete(post: PostRecord) {
    if (!token) {
      return;
    }

    if (!window.confirm(`确认删除《${post.title}》吗？删除后不可恢复。`)) {
      return;
    }

    await apiFetch(`/api/posts/${post.id}`, {
      method: "DELETE",
      token,
    });
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  async function handleStatusChange(postId: number, status: "DRAFT" | "PUBLISHED") {
    if (!token) {
      return;
    }

    const updated = await apiFetch<PostRecord>(`/api/posts/${postId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });

    setPosts((current) => current.map((item) => (item.id === postId ? updated : item)));
  }

  async function handleFeaturedChange(post: PostRecord) {
    if (!token) {
      return;
    }

    if (post.status !== "PUBLISHED" && !post.isFeatured) {
      setMessage("只有已发布文章才能置顶到首页。");
      return;
    }

    const updated = await apiFetch<PostRecord>(`/api/posts/${post.id}/featured`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isFeatured: !post.isFeatured }),
    });

    setPosts((current) => current.map((item) => (item.id === post.id ? updated : item)));
    setMessage(updated.isFeatured ? "文章已置顶到首页。" : "已取消文章置顶。");
  }

  async function handleReply(messageId: number) {
    if (!token) {
      return;
    }

    const replyContent = (replyDrafts[messageId] || "").trim();
    if (replyContent.length > maxReplyLength) {
      setMessage(`回复最多 ${maxReplyLength} 字。`);
      return;
    }

    await apiFetch<GuestbookMessageRecord>(`/api/guestbook/${messageId}/reply`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ replyContent }),
    });
    setMessage(replyContent ? "留言回复已保存。" : "留言回复已清空。");
    await loadGuestbookMessages();
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("两次输入的新密码不一致。");
      return;
    }

    try {
      await apiFetch("/api/auth/password", {
        method: "PATCH",
        token,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("密码已更新，下次登录请使用新密码。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修改密码失败");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">Admin Studio</p>
          <h1 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">内容后台</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
            管理文章、分类、站点设置、留言板与消息提醒。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[var(--color-line)] bg-white/88 px-5 py-2.5 text-sm"
          >
            退出登录
          </button>
          <Link href="/admin/settings" className="rounded-full border border-[var(--color-line)] bg-white/88 px-5 py-2.5 text-sm">
            站点设置
          </Link>
          <Link href="/admin/taxonomies" className="rounded-full border border-[var(--color-line)] bg-white/88 px-5 py-2.5 text-sm">
            分类与标签
          </Link>
          <Link href="/admin/posts/new" className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white">
            新建文章
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="文章数"
            value={summary.postCount}
            dailyDelta={summary.todayPostCount}
            icon={<FileIcon className="h-8 w-8 text-[var(--color-accent)]" />}
            accentClass="bg-[linear-gradient(90deg,#65cbbd,#4daaa0)]"
            badgeClass="bg-[linear-gradient(180deg,rgba(224,245,240,0.96),rgba(237,248,245,0.96))]"
            iconClass="text-[var(--color-accent)]"
          />
          <MetricCard
            label="阅读数"
            value={summary.totalViewCount}
            dailyDelta={summary.todayViewCount}
            icon={<GridIcon className="h-8 w-8 text-[#4b79e4]" />}
            accentClass="bg-[linear-gradient(90deg,#77a7ff,#4b79e4)]"
            badgeClass="bg-[linear-gradient(180deg,rgba(232,239,255,0.96),rgba(242,245,255,0.96))]"
            iconClass="text-[#4b79e4]"
          />
          <MetricCard
            label="点赞数"
            value={summary.totalLikeCount}
            dailyDelta={summary.todayLikeCount}
            icon={<TagIcon className="h-8 w-8 text-[#8d67e8]" />}
            accentClass="bg-[linear-gradient(90deg,#a688ff,#8460ea)]"
            badgeClass="bg-[linear-gradient(180deg,rgba(242,235,255,0.96),rgba(248,244,255,0.96))]"
            iconClass="text-[#8460ea]"
          />
          <MetricCard
            label="未读消息"
            value={summary.unreadNotificationCount}
            icon={<BellIcon className="h-8 w-8 text-[#e0aa44]" />}
            accentClass="bg-[linear-gradient(90deg,#f0c35f,#e0aa44)]"
            badgeClass="bg-[linear-gradient(180deg,rgba(255,245,220,0.96),rgba(255,250,238,0.96))]"
            iconClass="text-[#e0aa44]"
          />
        </div>
      )}

      <DashboardPanel
        icon={<PencilIcon className="h-9 w-9 text-[var(--color-accent)]" />}
        title="文章管理"
        description={`共 ${posts.length} 篇文章，评论总数 ${summary?.commentCount || 0}，已置顶 ${featuredPostCount} 篇。`}
        accentClass="bg-[radial-gradient(circle_at_left,rgba(199,240,233,0.92),rgba(243,250,248,0.18)_64%)]"
        action={
          <>
            <button
              type="button"
              onClick={() => setIsPostsOpen((current) => !current)}
              className="rounded-full bg-[var(--color-accent)] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(77,170,160,0.18)]"
            >
              {isPostsOpen ? "收起" : "展开"}
            </button>
          </>
        }
      >
        {isPostsOpen && (
          <div className="mt-5 grid gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={postSearch}
                onChange={(event) => setPostSearch(event.target.value)}
                placeholder="搜索标题、摘要、正文、分类、状态或置顶文章"
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none md:max-w-md"
              />
              <span className="text-sm text-[var(--color-text-faint)]">
                {message || `当前显示 ${filteredPosts.length} 篇`}
              </span>
            </div>

            {filteredPosts.map((post) => {
              const isPublished = post.status === "PUBLISHED";

              return (
                <div
                  key={post.id}
                  className="rounded-[22px] border border-[var(--color-line)] bg-white/76 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-faint)]">
                        <span>{post.category.name}</span>
                        <span>{isPublished ? "已发布" : "草稿"}</span>
                        <span>{post.commentCount} 条评论</span>
                        {post.isFeatured && (
                          <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[var(--color-accent)]">
                            已置顶
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">{post.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:max-w-[360px] lg:justify-end">
                      <button
                        type="button"
                        onClick={() => void handleFeaturedChange(post)}
                        disabled={!isPublished && !post.isFeatured}
                        className={`rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          post.isFeatured
                            ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)]"
                            : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        }`}
                      >
                        {post.isFeatured ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(post.id, isPublished ? "DRAFT" : "PUBLISHED")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          isPublished
                            ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)]"
                            : "bg-[var(--color-accent)] text-white"
                        }`}
                      >
                        {isPublished ? "撤回为草稿" : "立即发布"}
                      </button>
                      <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm">
                        编辑
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(post)}
                        className="rounded-full border border-[var(--color-rose)] bg-white px-4 py-2 text-sm text-[#b44a5a]"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPosts.length === 0 && (
              <p className="text-sm text-[var(--color-text)]">没有匹配的文章。</p>
            )}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        icon={<BellIcon className="h-9 w-9 text-[var(--color-accent)]" />}
        title="消息管理"
        description={`点赞、评论和留言都会出现在这里。当前未读 ${unreadNotificationCount} 条。`}
        accentClass="bg-[radial-gradient(circle_at_left,rgba(199,240,233,0.92),rgba(243,250,248,0.18)_64%)]"
        action={
          <>
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={() => void handleReadAllNotifications()}
                className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm text-[var(--color-text)]"
              >
                全部标记已读
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="rounded-full bg-[var(--color-accent)] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(77,170,160,0.18)]"
            >
              {isNotificationsOpen ? "收起" : "展开"}
            </button>
          </>
        }
      >
        {isNotificationsOpen && (
          <div className="mt-5 grid gap-4">
            {pagedNotifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[22px] border p-5 ${
                  item.isRead
                    ? "border-[var(--color-line)] bg-white/68"
                    : "border-[var(--color-accent)]/25 bg-[var(--color-accent)]/6"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--color-text)]">
                        {item.type === "LIKE"
                          ? "点赞"
                          : item.type === "COMMENT"
                            ? "评论"
                            : "留言"}
                      </span>
                      {!item.isRead && (
                        <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs text-white">
                          未读
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-serif text-2xl text-[var(--color-ink)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">{item.content}</p>
                    <p className="mt-3 text-xs text-[var(--color-text-faint)]">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:max-w-[360px] lg:justify-end">
                    {item.post && (
                      <Link
                        href={`/posts/${item.post.slug}`}
                        className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm"
                      >
                        查看文章
                      </Link>
                    )}
                    {item.type === "GUESTBOOK" && (
                      <button
                        type="button"
                        onClick={() => setIsGuestbookOpen(true)}
                        className="rounded-full border border-[var(--color-line)] bg-white/88 px-4 py-2 text-sm"
                      >
                        查看留言
                      </button>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => void handleReadNotification(item.id)}
                        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        标记已读
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="text-sm text-[var(--color-text)]">暂时没有新的提醒。</p>
            )}

            {notifications.length > notificationsPerPage && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-sm text-[var(--color-text-faint)]">
                  第 {notificationPage} / {notificationPageCount} 页
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationPage((current) => Math.max(1, current - 1))}
                    disabled={notificationPage === 1}
                    className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm text-[var(--color-text)] disabled:opacity-45"
                  >
                    上一页
                  </button>
                  {Array.from({ length: notificationPageCount }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setNotificationPage(page)}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm ${
                        page === notificationPage
                          ? "bg-[var(--color-accent)] font-semibold text-white"
                          : "border border-[var(--color-line)] bg-white text-[var(--color-text)]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationPage((current) => Math.min(notificationPageCount, current + 1))
                    }
                    disabled={notificationPage === notificationPageCount}
                    className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm text-[var(--color-text)] disabled:opacity-45"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        icon={<MessageIcon className="h-9 w-9 text-[#8d67e8]" />}
        title="留言板管理"
        description={`共 ${guestbookMessages.length} 条留言，包含公开留言和私密留言。`}
        accentClass="bg-[radial-gradient(circle_at_left,rgba(235,229,255,0.94),rgba(249,247,255,0.14)_64%)]"
        action={
          <button
            type="button"
            onClick={() => setIsGuestbookOpen((current) => !current)}
            className="rounded-full bg-[var(--color-accent)] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(77,170,160,0.18)]"
          >
            {isGuestbookOpen ? "收起" : "展开"}
          </button>
        }
      >
        {isGuestbookOpen && (
          <div className="mt-5 grid gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={guestbookSearch}
                onChange={(event) => setGuestbookSearch(event.target.value)}
                placeholder="搜索昵称、留言、回复、公开或私密"
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none md:max-w-md"
              />
              <span className="text-sm text-[var(--color-text-faint)]">
                {message || `当前显示 ${filteredGuestbookMessages.length} 条`}
              </span>
            </div>

            {filteredGuestbookMessages.map((item) => {
              const replyValue = replyDrafts[item.id] || "";
              const remaining = maxReplyLength - replyValue.length;

              return (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-[var(--color-line)] bg-white/76 p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-2xl text-[var(--color-ink)]">{item.authorName}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            item.isPrivate
                              ? "bg-[#f6d6de] text-[#9c4053]"
                              : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          }`}
                        >
                          {item.isPrivate ? "私密留言" : "公开留言"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-faint)]">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-[var(--color-text)]">{item.content}</p>
                      {item.isPrivate && (
                        <p className="mt-3 text-xs leading-6 text-[#9c4053]">
                          这条留言不会在前台展示，访客无法在前台看到回复。
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={replyValue}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({
                            ...current,
                            [item.id]: event.target.value.slice(0, maxReplyLength),
                          }))
                        }
                        maxLength={maxReplyLength}
                        placeholder="回复这条留言，最多 100 字"
                        className="min-h-[120px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            remaining < 10 ? "text-xs text-[#b44a5a]" : "text-xs text-[var(--color-text-faint)]"
                          }
                        >
                          还可输入 {remaining} 字
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleReply(item.id)}
                          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white"
                        >
                          保存回复
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGuestbookMessages.length === 0 && (
              <p className="text-sm text-[var(--color-text)]">没有匹配的留言。</p>
            )}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        icon={<ShieldIcon className="h-9 w-9 text-[#4b79e4]" />}
        title="账号安全"
        description="修改当前管理员登录密码。"
        accentClass="bg-[radial-gradient(circle_at_left,rgba(224,235,255,0.94),rgba(247,250,255,0.18)_64%)]"
        action={
          <button
            type="button"
            onClick={() => setIsPasswordOpen((current) => !current)}
            className="rounded-full border border-[#86a7ef] bg-white px-6 py-2.5 text-sm font-semibold text-[#4b79e4]"
          >
            {isPasswordOpen ? "收起" : "更改密码"}
          </button>
        }
      >
        {isPasswordOpen && (
          <form onSubmit={handleChangePassword} className="mt-5 grid gap-4 md:grid-cols-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="当前密码"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="新密码，至少 8 位"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="确认新密码"
              className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              required
            />
            <div className="md:col-span-3 flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                保存新密码
              </button>
            </div>
          </form>
        )}
      </DashboardPanel>
    </main>
  );
}
