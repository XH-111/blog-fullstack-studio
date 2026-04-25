import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

const profileFacts = [
  "这是一个完整的前后端博客系统，包含后台登录、文章管理、评论系统和可选 AI 正确性评论。",
  "站点用于长期沉淀 Java、JVM、后端工程实践、项目复盘和个人成长记录。",
  "首页头像、背景图、标题和简介都可以在后台设置页修改。",
  "AI 审核功能已经移除；当前 AI 只用于摘要补充和可选的内容正确性评论。",
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="关于我"
        description="技术、生活、项目和写作，会在这里长期沉淀。"
        image="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="relative z-10 mx-auto -mt-8 grid w-full max-w-6xl gap-6 px-4 md:grid-cols-2">
        {profileFacts.map((fact) => (
          <SurfaceCard key={fact}>
            <p className="text-sm leading-8 text-[var(--color-text)]">{fact}</p>
          </SurfaceCard>
        ))}
      </section>
    </main>
  );
}
