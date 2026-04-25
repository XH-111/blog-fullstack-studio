import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SurfaceCard } from "@/components/surface-card";
import { apiFetch, AboutHonorItem, AboutProfileRecord } from "@/lib/api";
import { pastelChips } from "@/lib/theme";

export const dynamic = "force-dynamic";

const fallbackAbout: AboutProfileRecord = {
  id: "about",
  introTitle: "个人简介",
  introBody:
    "这里会长期记录我的成长、技术方向、项目复盘和生活片段。后台可以随时修改这些内容。",
  skills: "Java\nJVM\nSpring Boot\nNext.js\nExpress\nPrisma\nSQLite",
  experiences: "2024｜开始系统整理 Java 与后端工程笔记\n2025｜搭建个人博客并持续完善",
  projects:
    "个人博客｜支持知识库、富文本写作、留言板、点赞和后台管理的全栈博客｜Next.js / Express / Prisma｜/knowledge",
  honors: "[]",
  updatedAt: new Date().toISOString(),
};

const navItems = [
  { href: "#intro", label: "个人简介" },
  { href: "#skills", label: "技能方向" },
  { href: "#experience", label: "个人经历" },
  { href: "#projects", label: "项目经历" },
  { href: "#honors", label: "荣誉照片墙" },
];

function splitList(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split(/[｜|]/);
      return {
        title: title?.trim() || "记录",
        body: rest.join("｜").trim() || line,
      };
    });
}

function parseProjects(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, description, stack, link] = line.split(/[｜|]/);
      return {
        name: name?.trim() || "项目",
        description: description?.trim() || line,
        stack: stack?.trim() || "",
        link: link?.trim() || "",
      };
    });
}

function parseHonors(value: string): AboutHonorItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        title: String(item?.title || "").trim(),
        description: String(item?.description || "").trim(),
        image: String(item?.image || "").trim(),
      }))
      .filter((item) => item.title || item.description || item.image);
  } catch (_error) {
    return [];
  }
}

async function getAboutProfile() {
  try {
    return await apiFetch<AboutProfileRecord>("/api/about");
  } catch (_error) {
    return fallbackAbout;
  }
}

export default async function AboutPage() {
  const about = await getAboutProfile();
  const skills = splitList(about.skills);
  const experiences = parseLines(about.experiences);
  const projects = parseProjects(about.projects);
  const honors = parseHonors(about.honors);

  return (
    <main className="flex flex-1 flex-col pb-20">
      <PageHero
        title="关于我"
        description="技术、成长、项目和生活记录，都在这里长期沉淀。"
        image="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="relative z-10 mx-auto -mt-10 grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SurfaceCard className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              About Me
            </p>
            <h2 className="font-serif text-3xl text-[var(--color-ink)]">
              快速跳转
            </h2>
            <div className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[var(--color-line)] bg-white/80 px-4 py-2.5 text-sm text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </SurfaceCard>
        </aside>

        <div className="space-y-6">
          <SurfaceCard id="intro" className="scroll-mt-24">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Profile
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">
              {about.introTitle}
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-[var(--color-text)]">
              {about.introBody.split(/\n+/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard id="skills" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Skills
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
                  技能栈 / 关注方向
                </h2>
              </div>
              <span className="rounded-full bg-white/80 px-4 py-2 text-sm text-[var(--color-text)]">
                {skills.length} 个方向
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm"
                  style={{
                    backgroundColor: pastelChips[index % pastelChips.length],
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard id="experience" className="scroll-mt-24">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Timeline
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
              个人经历
            </h2>
            <div className="mt-7 space-y-5">
              {experiences.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="relative border-l border-[var(--color-line)] pl-6"
                >
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_5px_rgba(105,197,181,0.18)]" />
                  <p className="font-serif text-xl text-[var(--color-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard id="projects" className="scroll-mt-24">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Projects
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
              项目经历
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {projects.map((project, index) => {
                const content = (
                  <article className="h-full rounded-[24px] border border-[var(--color-line)] bg-white/78 p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                    <p className="font-serif text-2xl text-[var(--color-ink)]">
                      {project.name}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
                      {project.description}
                    </p>
                    {project.stack ? (
                      <p className="mt-4 rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs text-[var(--color-accent)]">
                        {project.stack}
                      </p>
                    ) : null}
                  </article>
                );

                return project.link ? (
                  <Link key={`${project.name}-${index}`} href={project.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={`${project.name}-${index}`}>{content}</div>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard id="honors" className="scroll-mt-24">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Gallery
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
              荣誉 / 证书 / 记录
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(honors.length ? honors : [{ title: "照片墙待补充", description: "可以在后台上传图片或填写图片地址。", image: "" }]).map(
                (honor, index) => (
                  <article
                    key={`${honor.title}-${index}`}
                    className="overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-white/82"
                  >
                    {honor.image ? (
                      <div
                        className="aspect-[4/3] bg-cover bg-center"
                        style={{ backgroundImage: `url(${honor.image})` }}
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#d7f1ef,#eaf5ff_48%,#fff1c6)] text-sm text-[var(--color-text)]">
                        暂无图片
                      </div>
                    )}
                    <div className="p-5">
                      <p className="font-serif text-xl text-[var(--color-ink)]">
                        {honor.title || "记录标题"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                        {honor.description || "这里会展示荣誉、证书或值得保留的成长记录。"}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </main>
  );
}
