require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify");
const MarkdownIt = require("markdown-it");

const prisma = new PrismaClient();
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

function toSlug(value) {
  return (
    slugify(value, { lower: true, strict: true, locale: "zh" }) ||
    `item-${Date.now()}`
  );
}

async function upsertCategory(name) {
  const slug = toSlug(name);
  const existed = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }] },
  });

  if (existed) {
    return prisma.category.update({
      where: { id: existed.id },
      data: { name, slug },
    });
  }

  return prisma.category.create({ data: { name, slug } });
}

async function upsertTag(name) {
  const slug = toSlug(name);
  const existed = await prisma.tag.findFirst({
    where: { OR: [{ slug }, { name }] },
  });

  if (existed) {
    return prisma.tag.update({
      where: { id: existed.id },
      data: { name, slug },
    });
  }

  return prisma.tag.create({ data: { name, slug } });
}

async function upsertPost(post) {
  return prisma.post.upsert({
    where: { slug: post.slug },
    update: {
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      contentMarkdown: post.contentMarkdown,
      contentHtml: md.render(post.contentMarkdown),
      status: post.status,
      publishedAt: post.publishedAt,
      categoryId: post.categoryId,
    },
    create: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      contentMarkdown: post.contentMarkdown,
      contentHtml: md.render(post.contentMarkdown),
      status: post.status,
      publishedAt: post.publishedAt,
      categoryId: post.categoryId,
    },
  });
}

async function syncPostTags(postId, tagNames) {
  const tags = [];

  for (const tagName of tagNames) {
    tags.push(await upsertTag(tagName));
  }

  await prisma.postTag.deleteMany({ where: { postId } });

  if (tags.length > 0) {
    await prisma.postTag.createMany({
      data: tags.map((tag) => ({ postId, tagId: tag.id })),
    });
  }
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || "博客管理员";

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      displayName: adminDisplayName,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      username: adminUsername,
      displayName: adminDisplayName,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "site" },
    update: {
      siteTitle: "POETIZE",
      heroTitle: "生活与技术的温柔归档",
      heroDescription:
        "长期记录 Java、JVM、工程实践与个人项目，把技术写成可以反复回看的作品。",
      heroImage:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
      profileName: "何晨旭",
      profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    },
    create: {
      id: "site",
      siteTitle: "POETIZE",
      heroTitle: "生活与技术的温柔归档",
      heroDescription:
        "长期记录 Java、JVM、工程实践与个人项目，把技术写成可以反复回看的作品。",
      heroImage:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
      profileName: "何晨旭",
      profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    },
  });

  const engineering = await upsertCategory("工程笔记");
  const jvmColumn = await upsertCategory("JVM 专栏");
  const projectReview = await upsertCategory("项目复盘");

  const posts = [
    {
      slug: "welcome-to-fullstack-blog",
      title: "欢迎来到全栈博客项目",
      excerpt:
        "这是一篇初始化文章，用来确认博客前后台、评论系统、Markdown 渲染和可选 AI 正确性评论都已经打通。",
      coverImage:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      categoryId: engineering.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-25T09:00:00.000Z"),
      tagNames: ["Next.js", "Express", "SQLite"],
      contentMarkdown: `# 欢迎

这套博客已经具备完整的前后台能力：

- 前台展示与搜索
- 后台写作与分类管理
- 游客评论与楼层
- 可选 AI 正确性评论

## 当前定位

这不是简单的静态博客模板，而是一套可以继续长期扩展的个人内容系统。后续可以重点沉淀 Java、JVM、项目复盘与工程实践内容。
`,
    },
    {
      slug: "jvm-memory-model-and-object-lifecycle",
      title: "JVM 内存结构与对象创建流程",
      excerpt:
        "从程序计数器、虚拟机栈、堆、方法区出发，串起 Java 对象从创建到进入 GC 可达性分析的完整路径。",
      coverImage:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      categoryId: jvmColumn.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-24T09:00:00.000Z"),
      tagNames: ["JVM", "内存模型", "对象创建"],
      contentMarkdown: `# JVM 内存结构与对象创建流程

理解 JVM 内存结构时，不要只背“堆、栈、方法区”这些名词。更有效的方式，是把运行时数据区和对象生命周期连成一条线。

## new 一个对象会发生什么

1. 类加载检查
2. 分配内存
3. 并发安全处理
4. 零值初始化
5. 设置对象头
6. 执行构造方法

这样回答既有结构，也有过程感。
`,
    },
    {
      slug: "project-notes-template",
      title: "项目复盘模板：如何把一次开发写成有价值的沉淀",
      excerpt:
        "用固定结构记录项目背景、目标、架构、风险和复盘，比只贴代码更有长期价值。",
      coverImage:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      categoryId: projectReview.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-22T09:00:00.000Z"),
      tagNames: ["项目复盘", "工程方法"],
      contentMarkdown: `# 项目复盘模板

## 1. 项目背景

先说明为什么要做这件事，解决的是什么问题。

## 2. 核心目标

目标尽量量化，避免只写“优化系统”这种空泛描述。

## 3. 技术方案

说明为什么选这套技术栈、有什么备选方案、当前方案解决了什么问题。
`,
    },
  ];

  for (const post of posts) {
    const savedPost = await upsertPost(post);
    await syncPostTags(savedPost.id, post.tagNames);
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
