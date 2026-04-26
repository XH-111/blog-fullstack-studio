export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

export function resolveUploadUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("/uploads/")) {
    return `${API_BASE}${url}`;
  }

  return url;
}

export function normalizeRenderedHtml(html?: string | null) {
  if (!html) {
    return "";
  }

  return html.replace(
    /(<img\b[^>]*\bsrc=["'])(\/uploads\/[^"']+)(["'][^>]*>)/gi,
    (_match, prefix, src, suffix) => `${prefix}${resolveUploadUrl(src)}${suffix}`
  );
}

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

export type GuestbookMessageRecord = {
  id: number;
  authorName: string;
  content: string;
  isPrivate: boolean;
  replyContent?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HomeReactionRecord = {
  id: string;
  total: number;
  tagCounts: Record<string, number>;
  updatedAt: string;
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
  featuredTitle: string;
  featuredDescription: string;
  profileName: string;
  profileTagline: string;
  profileImage?: string | null;
  updatedAt: string;
};

export type AboutHonorItem = {
  title: string;
  description: string;
  image: string;
};

export type AboutProfileRecord = {
  id: string;
  introTitle: string;
  introBody: string;
  skills: string;
  experiences: string;
  projects: string;
  honors: string;
  updatedAt: string;
};

export type PostRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt?: string | null;
  viewCount: number;
  likeCount: number;
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
