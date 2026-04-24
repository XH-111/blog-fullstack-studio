require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify");
const markdownIt = require("markdown-it");

const prisma = new PrismaClient();
const md = new markdownIt({ html: true, linkify: true, typographer: true });

function toSlug(value) {
  return (
    slugify(value, { lower: true, strict: true, locale: "zh" }) ||
    `item-${Date.now()}`
  );
}

async function upsertCategory(name) {
  const slug = toSlug(name);
  const existed = await prisma.category.findFirst({
    where: {
      OR: [{ slug }, { name }],
    },
  });

  if (existed) {
    return prisma.category.update({
      where: { id: existed.id },
      data: { name, slug },
    });
  }

  return prisma.category.create({
    data: { name, slug },
  });
}

async function upsertTag(name) {
  const slug = toSlug(name);
  const existed = await prisma.tag.findFirst({
    where: {
      OR: [{ slug }, { name }],
    },
  });

  if (existed) {
    return prisma.tag.update({
      where: { id: existed.id },
      data: { name, slug },
    });
  }

  return prisma.tag.create({
    data: { name, slug },
  });
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
      data: tags.map((tag) => ({
        postId,
        tagId: tag.id,
      })),
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
  const projectReview = await upsertCategory("项目复盘");
  const javaCore = await upsertCategory("Java 核心");
  const jvmColumn = await upsertCategory("JVM 专栏");
  const interviewNotes = await upsertCategory("面试沉淀");

  const publishedAt = new Date("2026-04-25T09:00:00.000Z");

  const posts = [
    {
      slug: "welcome-to-fullstack-blog",
      title: "欢迎来到全栈博客项目",
      excerpt:
        "这是一篇初始化文章，用来确认博客前后台、评论系统与 AI 能力都已经打通。",
      coverImage:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      categoryId: engineering.id,
      status: "PUBLISHED",
      publishedAt,
      tagNames: ["Next.js", "Express", "SQLite", "AI 博客"],
      contentMarkdown: `# 欢迎

这套博客已经具备完整的前后台能力：

- 前台展示与搜索
- 后台写作与分类管理
- 游客评论与楼层
- AI 审核与 AI 官方评论

## 当前定位

这不是简单的静态博客模板，而是一套可以继续长期扩展的个人内容系统。后续会重点沉淀 Java、JVM、项目复盘与工程实践内容。

## 后续计划

1. 继续补充系统设计与 Java 文章。
2. 将站点设置、图片和风格做成后台可配置。
3. 持续优化 AI 审核与评论质量。`,
    },
    {
      slug: "project-notes-template",
      title: "项目复盘模板：如何把一次开发写成有价值的沉淀",
      excerpt:
        "用一套固定结构记录项目背景、目标、架构、风险和复盘，比只贴代码更有长期价值。",
      coverImage:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      categoryId: projectReview.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-22T09:00:00.000Z"),
      tagNames: ["项目复盘", "工程方法", "表达能力"],
      contentMarkdown: `# 项目复盘模板

## 1. 项目背景

先说明为什么要做这件事，解决的是什么问题。

## 2. 核心目标

目标尽量量化，比如“把人工发布改成后台发布”“把部署时间从半小时缩短到五分钟”。

## 3. 技术方案

- 为什么选这个技术栈
- 有哪些备选方案
- 当前方案解决了什么问题

## 4. 落地过程

记录关键节点、踩坑与取舍。

## 5. 复盘结论

说明做对了什么、哪些地方可以重来、以后如何抽成方法论。`,
    },
    {
      slug: "jvm-memory-model-and-object-lifecycle",
      title: "JVM 内存结构与对象创建全流程",
      excerpt:
        "从程序计数器、虚拟机栈、堆、方法区出发，串起一个 Java 对象从出生到进入 GC 可达性分析的完整路径。",
      coverImage:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      categoryId: jvmColumn.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-24T09:00:00.000Z"),
      tagNames: ["JVM", "内存模型", "对象创建"],
      contentMarkdown: `# JVM 内存结构与对象创建全流程

很多人记住了“堆、栈、方法区”这些名词，但一到面试题“new 一个对象到底经历了什么”，回答就开始散。更有效的方式，是把 **运行时数据区** 和 **对象生命周期** 连成一条线。

## JVM 运行时数据区

### 1. 程序计数器

程序计数器可以理解成线程当前执行到哪条字节码指令的指针。它是线程私有的，也是少数几乎不会触发 OOM 的区域。

### 2. 虚拟机栈

每次方法调用都会创建一个栈帧，里面放局部变量表、操作数栈、动态链接和方法返回地址。方法执行结束后，对应栈帧出栈。

### 3. 本地方法栈

和虚拟机栈类似，只是服务对象是 Native 方法。日常开发感知不强，但理解上可以和虚拟机栈放在一组去记。

### 4. 堆

堆是对象实例和数组的主要分配区域，也是垃圾回收的主战场。面试里常说的新生代、老年代，本质上都是堆的进一步划分。

### 5. 方法区

HotSpot 在较新版本里把永久代移除，使用元空间承载类元数据。理解重点不是“永久代”这个历史名词，而是：**类信息、常量、静态变量、即时编译后的代码** 需要有一个长期存放区域。

## new 一个对象会发生什么

### 1. 类检查

执行 \`new\` 指令时，JVM 会先检查这个类是否已经被加载、解析和初始化。如果没有，会先触发类加载流程。

### 2. 分配内存

类元信息里已经能确定对象需要多大空间，JVM 会在堆中为对象分配内存。常见实现方式有：

- 指针碰撞
- 空闲列表

具体采用哪种方式，取决于堆是否规整。

### 3. 并发安全

多线程同时分配对象时，JVM 需要保证安全。常见手段有：

- CAS + 失败重试
- TLAB（线程本地分配缓冲区）

TLAB 的意义非常大，它能减少线程直接竞争堆空间的频率。

### 4. 零值初始化

对象分配完空间后，JVM 会先把实例字段置成零值。这一步保证对象即使还没执行构造方法，也具备“默认可用”的状态。

### 5. 设置对象头

对象头里会写入：

- 哈希码相关信息
- GC 分代年龄
- 锁状态标记
- 类型指针

如果对象是数组，还会额外记录数组长度。

### 6. 执行构造方法

最后才真正执行 \`<init>\`。到这一步，我们熟悉的字段赋值、构造逻辑才开始生效。

## 对象什么时候会被回收

对象不是“引用没了就立刻删”，而是要经过可达性分析。GC Roots 常见来源包括：

- 虚拟机栈中的引用
- 方法区中的静态属性引用
- 常量引用
- JNI 引用

如果一个对象从 GC Roots 出发不可达，它才会被认为具备回收资格。

## 面试回答建议

如果面试官问“JVM 内存结构”，不要只背概念。可以按下面顺序答：

1. 先分线程私有和线程共享。
2. 再讲堆、栈、方法区各自存什么。
3. 最后用对象创建流程把这些区域串起来。

这样回答既有结构，也有过程感。`,
    },
    {
      slug: "gc-collectors-and-tuning-basics",
      title: "垃圾回收器、GC 日志与调优思路",
      excerpt:
        "别把 GC 调优理解成参数背诵。先建立判断顺序：现象、指标、日志、回收器，再谈参数。",
      coverImage:
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=80",
      categoryId: jvmColumn.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      tagNames: ["JVM", "GC", "性能调优"],
      contentMarkdown: `# 垃圾回收器、GC 日志与调优思路

很多人把 GC 调优做成了“复制一套参数”，这是最危险的方式。GC 调优不是参数崇拜，而是根据业务现象做定位。

## 先判断问题类型

看到 JVM 抖动时，先问自己三个问题：

1. 是吞吐量问题还是停顿时间问题？
2. 是偶发尖刺还是持续性恶化？
3. 是堆太小、对象分配过快，还是存在内存泄漏？

不先分问题类型，后面所有调参都容易盲目。

## 常见垃圾回收器认知框架

### Serial / Serial Old

单线程、实现简单，适合内存小、场景简单的客户端或实验环境。

### ParNew / CMS

一代人的经典组合。CMS 的核心价值是降低老年代回收停顿，但它也有碎片化、浮动垃圾等问题。

### Parallel Scavenge / Parallel Old

更偏吞吐量优先，适合后台批处理或对停顿不极致敏感的场景。

### G1

G1 的思路是把堆拆成多个 Region，通过预测停顿模型，尽量在设定时间内完成回收。它不是“永远最快”，但在综合场景下比较均衡。

## GC 日志应该怎么看

### 1. 先看 Full GC 是否频繁

如果 Full GC 频繁出现，说明问题通常已经比较严重。常见原因：

- 老年代空间不足
- 大对象分配过多
- 晋升失败
- 显式调用 \`System.gc()\`

### 2. 再看 Young GC 频率

Young GC 偶尔频繁不一定是坏事，但如果每秒都在回收，同时接口 RT 明显波动，就要关注新生代容量和对象创建速率。

### 3. 关注回收前后堆占用

关键不是“GC 发生了”，而是“GC 之后是否真的释放下来了”。如果每次回收后老年代仍持续上涨，要怀疑泄漏或缓存失控。

## 调优顺序建议

### 第一层：先定观测指标

- 接口 RT
- 吞吐量
- GC 次数
- GC 停顿时间
- 老年代占用趋势

### 第二层：确认业务特点

- 请求是否突发
- 是否有大量短命对象
- 是否有长生命周期缓存
- 是否有批量任务

### 第三层：再考虑参数

例如：

- 调整堆大小
- 调整新生代比例
- 调整目标停顿时间
- 选择更适合的回收器

## 调优误区

### 误区一：一上来先换回收器

没有日志支撑的换回收器，本质上是碰运气。

### 误区二：只看 JVM，不看代码

很多 GC 压力本质上是代码层问题，比如：

- 无意义对象创建
- 大量字符串拼接
- 缓存永不过期
- 集合无限增长

### 误区三：把 OOM 当成 GC 问题

OOM 有时是堆设置问题，但更常见的是对象根本没有被释放。

## 一个实际回答模板

如果被问“你怎么做 GC 调优”，可以这样回答：

1. 先看业务指标和监控现象。
2. 再看 GC 日志，区分 Young GC 和 Full GC。
3. 分析是分配过快、晋升异常还是内存泄漏。
4. 最后再针对性调整堆、代际比例或回收器。

这比直接背参数更像真实工程经验。`,
    },
    {
      slug: "classloading-parent-delegation-and-troubleshooting",
      title: "类加载机制、双亲委派与线上排障",
      excerpt:
        "理解类加载最有价值的不是背出五个阶段，而是知道什么时候会出 ClassNotFound、什么时候会出 NoClassDefFoundError。",
      coverImage:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
      categoryId: javaCore.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-21T09:00:00.000Z"),
      tagNames: ["JVM", "类加载", "排障"],
      contentMarkdown: `# 类加载机制、双亲委派与线上排障

很多人背过“加载、验证、准备、解析、初始化”，但一遇到真实问题还是分不清 \`ClassNotFoundException\` 和 \`NoClassDefFoundError\`。原因是只记了流程，没有记住问题发生在哪一层。

## 类加载的五个主要阶段

### 1. 加载

把字节码读进来，转成方法区可识别的数据结构，并在堆里生成对应的 \`Class\` 对象。

### 2. 验证

检查字节码是否符合 JVM 规范，避免不安全代码破坏虚拟机。

### 3. 准备

给类变量分配内存并设置默认值。这里要注意，是“默认值”，不是你代码里写的初始化值。

### 4. 解析

把符号引用替换成直接引用。

### 5. 初始化

真正执行类构造器 \`<clinit>\`，也就是静态变量显式赋值和静态代码块执行的阶段。

## 什么是双亲委派

双亲委派不是“父类加载器”，而是“先把加载请求往上委托”。常见好处有两个：

- 避免同一个类被重复加载
- 保证核心类库不被业务代码轻易篡改

例如 \`java.lang.String\` 优先交给启动类加载器加载，这样你自己写一个同名类也顶不掉 JDK 的核心实现。

## 常见类加载器

- 启动类加载器
- 扩展类加载器（在较新 JDK 里实现形式有变化，但理解层次仍有价值）
- 应用类加载器
- 自定义类加载器

线上系统里，很多框架隔离、热加载、插件化场景都会涉及自定义类加载器。

## 两类经典报错怎么区分

### ClassNotFoundException

这是“加载阶段就没找到类”。典型场景：

- 依赖没打进去
- classpath 配错
- 反射按类名加载时写错路径

### NoClassDefFoundError

这往往不是“类文件压根没有”，而是“类本来存在，但在初始化或依赖解析时失败了”。例如：

- 静态代码块抛异常
- 依赖链上的类缺失
- 版本冲突导致初始化失败

## 线上排障建议

### 1. 先看报错时机

是启动时报，还是某个接口第一次访问时报？这决定了你排查的是基础依赖，还是延迟加载路径。

### 2. 再看类名和调用链

别只看第一行异常，要结合 \`Caused by\` 一层层找。

### 3. 检查 jar 冲突

Java 线上问题里，版本冲突是高频原因。尤其是老项目多模块、多框架叠加时。

### 4. 判断是否和类初始化有关

如果是 \`NoClassDefFoundError\`，优先怀疑：

- 静态代码块
- 静态成员初始化
- 间接依赖类缺失

## 一个更像工程师的回答方式

如果面试官问“双亲委派”，别只讲定义。可以补一句：

> 它的实际价值在于避免核心类重复加载，并为线上排障提供一条判断路径：到底是类没找到，还是类加载到了但初始化失败。

这样回答更有工程味。`,
    },
    {
      slug: "java-interview-learning-route",
      title: "Java 后端面试复习路线：先补系统，再刷细节",
      excerpt:
        "准备 Java 面试时，最怕的是知识点零散。先搭知识骨架，再做题和查漏，效率会高很多。",
      coverImage:
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
      categoryId: interviewNotes.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-20T09:00:00.000Z"),
      tagNames: ["Java 面试", "学习路线", "后端成长"],
      contentMarkdown: `# Java 后端面试复习路线

我更推荐把复习分成三层：

## 第一层：语言与集合

- Java 基础语法与面向对象
- 集合体系与底层结构
- 并发基础与锁

## 第二层：JVM 与数据库

- 类加载、内存模型、垃圾回收
- MySQL 索引、事务、锁
- Redis 数据结构与缓存问题

## 第三层：工程与项目表达

- Spring 生态
- 微服务基础
- 消息队列
- 项目复盘和性能排障

技术面试不仅在问“你知不知道”，还在看“你能不能组织成清楚的表达”。`,
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
