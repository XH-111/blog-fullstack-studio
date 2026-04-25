import {
  apiFetch,
  CategoryRecord,
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
  welcomeTitle: "一套可以长期写作、持续扩展、适合沉淀技术与生活的个人博客",
  welcomeBody:
    "这里会持续更新 Java、JVM、后端工程实践、项目复盘和个人成长记录。它不是只展示结果的站点，而是一份长期可读的个人工程档案。",
  welcomeTags: "简洁首页,后台写作,分类管理,Markdown 编辑,AI 正确性评论,JVM 专栏",
  profileName: "何醒辉",
  profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
  profileImage: null,
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
  };
}

async function loadHomeData() {
  try {
    const [posts, categories, settings] = await Promise.all([
      apiFetch<PostRecord[]>("/api/posts"),
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<SiteSettingsRecord>("/api/settings"),
    ]);

    return {
      posts,
      categories,
      settings: normalizeSettings(settings),
    };
  } catch (error) {
    console.error(error);
    return {
      posts: [],
      categories: [],
      settings: fallbackSettings,
    };
  }
}

export default async function HomePage() {
  const { posts, categories, settings } = await loadHomeData();

  return (
    <HomePageContent
      posts={posts}
      categories={categories}
      settings={settings}
    />
  );
}
