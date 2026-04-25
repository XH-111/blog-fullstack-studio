export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "请求失败" }));
    throw new Error(errorBody.message || "请求失败");
  }

  return response.json();
}

export type CommentRecord = {
  id: number;
  authorName: string;
  email?: string | null;
  content: string;
  floor: number;
  isAi: boolean;
  createdAt: string;
};

export type CategoryRecord = {
  id: number;
  name: string;
  slug: string;
  _count?: { posts: number };
};

export type TagRecord = {
  id: number;
  name: string;
  slug: string;
  _count?: { postTags: number };
};

export type SiteSettingsRecord = {
  id: string;
  siteTitle: string;
  heroTitle: string;
  heroDescription: string;
  heroImage?: string | null;
  welcomeEyebrow: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeTags: string;
  profileName: string;
  profileTagline: string;
  profileImage?: string | null;
  updatedAt: string;
};

export type PostRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  contentMarkdown: string;
  contentJson?: string | null;
  contentHtml: string;
  contentText?: string | null;
  category: { id: number; name: string; slug: string };
  tags: Array<{ id: number; name: string; slug: string }>;
  aiOfficialComment?: { content: string } | null;
  commentCount: number;
  comments?: CommentRecord[];
};
