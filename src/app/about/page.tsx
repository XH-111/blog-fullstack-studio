import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";

const profileFacts = [
  "这是一个完整的前后端博客系统示例，带后台登录、文章管理、评论系统和 AI 能力预留。",
  "页面风格参考你提供的图片：大背景首屏、波浪过渡、浅色卡片和组件化内容区。",
  "后续可以继续扩展为你自己的正式博客，只需要替换文章、个人信息和图片资源。",
  "如果接入真实大模型 API，文章发布后会自动得到 AI 审核建议和 AI 官方评论。",
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="关于我"
        description="技术、生活、项目和 AI 工作流，会在这里长期沉淀。"
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
