require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify");

const prisma = new PrismaClient();

async function upsertCategory(name) {
  const slug = slugify(name, { lower: true, strict: true, locale: "zh" });
  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || "admin" },
    update: {
      displayName: process.env.ADMIN_DISPLAY_NAME || "博客管理员",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      username: process.env.ADMIN_USERNAME || "admin",
      displayName: process.env.ADMIN_DISPLAY_NAME || "博客管理员",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const engineering = await upsertCategory("工程笔记");
  const projects = await upsertCategory("项目复盘");

  const post = await prisma.post.upsert({
    where: { slug: "welcome-to-fullstack-blog" },
    update: {},
    create: {
      title: "欢迎来到全栈博客项目",
      slug: "welcome-to-fullstack-blog",
      excerpt:
        "这是一篇初始化文章，用来确认博客前后端、评论系统与 AI 模块已经打通。",
      contentMarkdown:
        "# 欢迎\n\n这是一篇初始化文章。\n\n- 支持 Markdown 编辑\n- 支持分类和标签\n- 支持 AI 内容审核和 AI 官方评论",
      contentHtml:
        "<h1>欢迎</h1><p>这是一篇初始化文章。</p><ul><li>支持 Markdown 编辑</li><li>支持分类和标签</li><li>支持 AI 内容审核和 AI 官方评论</li></ul>",
      categoryId: engineering.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      coverImage:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    },
  });

  const projectPost = await prisma.post.upsert({
    where: { slug: "project-notes-template" },
    update: {},
    create: {
      title: "项目复盘模板",
      slug: "project-notes-template",
      excerpt: "后续可以用这一类结构去沉淀项目背景、架构、实现和复盘。",
      contentMarkdown:
        "# 项目复盘模板\n\n## 背景\n说明项目为什么做。\n\n## 架构\n说明系统结构。\n\n## 复盘\n说明做对了什么，还能改进什么。",
      contentHtml:
        "<h1>项目复盘模板</h1><h2>背景</h2><p>说明项目为什么做。</p><h2>架构</h2><p>说明系统结构。</p><h2>复盘</h2><p>说明做对了什么，还能改进什么。</p>",
      categoryId: projects.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const tagNames = ["Next.js", "Express", "SQLite", "AI Blog"];

  for (const [index, name] of tagNames.entries()) {
    const slug = slugify(name, { lower: true, strict: true });
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });

    await prisma.postTag.upsert({
      where: {
        postId_tagId: {
          postId: index < 2 ? post.id : projectPost.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        postId: index < 2 ? post.id : projectPost.id,
        tagId: tag.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
