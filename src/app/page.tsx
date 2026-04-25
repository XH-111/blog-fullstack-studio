import {
  apiFetch,
  CategoryRecord,
  GuestbookMessageRecord,
  HomeReactionRecord,
  PostRecord,
  SiteSettingsRecord,
} from "@/lib/api";
import { HomePageContent } from "@/components/home-page-content";

export const dynamic = "force-dynamic";

const fallbackSettings: SiteSettingsRecord = {
  id: "site",
  siteTitle: "POETIZE",
  heroTitle: "生活与技术的温柔归档",
  heroDescription:
    "长期记录 Java、JVM、工程实践与个人项目，把技术写成可以反复回看的作品。",
  heroImage:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
  welcomeEyebrow: "欢迎光临",
  welcomeTitle: "Welcome to my blog.",
  welcomeBody: "点击下方标签，为主播点赞。",
  welcomeTags: "帅气,天真,可爱,真诚,勇敢,聪明",
  featuredTitle: "置顶文章",
  featuredDescription: "从知识库里挑选的最多三篇内容。",
  profileName: "何醒旭",
  profileTagline: "内向敏感小男孩",
  profileImage: null,
  updatedAt: new Date().toISOString(),
};

const fallbackReaction: HomeReactionRecord = {
  id: "home",
  total: 0,
  tagCounts: {},
  updatedAt: new Date().toISOString(),
};

function normalizeSettings(settings: SiteSettingsRecord): SiteSettingsRecord {
  return {
    ...fallbackSettings,
    ...settings,
    welcomeEyebrow: settings.welcomeEyebrow || fallbackSettings.welcomeEyebrow,
    welcomeTitle: settings.welcomeTitle || fallbackSettings.welcomeTitle,
    welcomeBody: settings.welcomeBody || fallbackSettings.welcomeBody,
    welcomeTags: settings.welcomeTags || fallbackSettings.welcomeTags,
    featuredTitle: settings.featuredTitle || fallbackSettings.featuredTitle,
    featuredDescription:
      settings.featuredDescription || fallbackSettings.featuredDescription,
  };
}

async function loadHomeData() {
  try {
    const [posts, categories, settings, reaction, guestbookMessages] = await Promise.all([
      apiFetch<PostRecord[]>("/api/posts"),
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<SiteSettingsRecord>("/api/settings"),
      apiFetch<HomeReactionRecord>("/api/home-reactions"),
      apiFetch<GuestbookMessageRecord[]>("/api/guestbook"),
    ]);

    return {
      posts,
      categories,
      settings: normalizeSettings(settings),
      reaction,
      guestbookCount: guestbookMessages.length,
    };
  } catch (error) {
    console.error(error);
    return {
      posts: [],
      categories: [],
      settings: fallbackSettings,
      reaction: fallbackReaction,
      guestbookCount: 0,
    };
  }
}

export default async function HomePage() {
  const { posts, categories, settings, reaction, guestbookCount } = await loadHomeData();

  return (
    <HomePageContent
      posts={posts}
      categories={categories}
      settings={settings}
      reaction={reaction}
      guestbookCount={guestbookCount}
    />
  );
}
