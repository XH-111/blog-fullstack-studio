require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { renderMarkdown } = require("../server/utils/markdown");
const { toSlug } = require("../server/utils/slug");

const prisma = new PrismaClient();

const DEFAULT_COVER = "/images/default-cover.svg";
const SCRIPT_PREFIX = "quality-note";

/*
  Template purpose:
  1. Keep a stable article schema for other models to extend.
  2. Write directly into Prisma without calling any API.
  3. Upsert categories/tags and de-duplicate by slug.

  How other models should extend this file:
  - Copy an existing article object.
  - Replace title/excerpt/markdown/category/tags/publishedAt.
  - Keep the same field names.
  - Do not invent new schema fields.
  - Keep content natural; avoid obvious repeated section headings in every post.
*/

const articles = [
  {
    title: "HashMap 高频面试题：从底层结构到 put 流程怎么讲",
    excerpt:
      "围绕数组、链表、红黑树、扩容和线程安全几个面试高频点，整理 HashMap 这题更像后端开发者的回答方式。",
    category: "Java 高频面试",
    tags: ["Java", "HashMap", "集合", "面试高频"],
    publishedAt: "2026-04-26T14:20:00+08:00",
    viewCount: 128,
    likeCount: 15,
    comments: [
      {
        authorName: "准备面试中",
        content: "这篇比我之前背的版本顺很多，尤其是树化条件这里。",
        createdAt: "2026-04-26T16:10:00+08:00",
      },
    ],
    markdown: `## HashMap 高频面试题：从底层结构到 put 流程怎么讲

HashMap 这题几乎是 Java 面试绕不过去的东西。问题在于，很多人一开口就是“数组加链表加红黑树”，这句话不能说错，但也很难说出层次。

如果真的在面试里回答，我更倾向于按三步来讲。

第一步，先讲它解决什么问题。HashMap 的核心目标是通过 key 快速定位 value。它不是靠遍历找，而是先对 key 做 hash，再把 hash 映射到数组下标。只要分布合理，平均查询效率会比较高。

第二步，讲底层结构。JDK 8 里的 HashMap 可以理解成数组为主，冲突时在桶位上挂链表，链表过长再转成红黑树。这里不要把“红黑树”说得太玄，它只是为了让极端冲突时的查询复杂度别一直停在 O(n)。

第三步，讲 put 流程。大致就是：

1. 计算 key 的 hash。
2. 定位数组下标。
3. 如果桶位为空，直接放进去。
4. 如果不为空，比较 key 是否相同；相同则覆盖。
5. 如果不同，就在链表或树结构里继续处理。
6. 插入后看是否超过阈值，超过就扩容。

真正容易被追问的是两个点。

一个是为什么要扰动 hash。原因很简单，数组长度通常是 2 的幂，如果只看低位，很多高位信息会浪费掉。JDK 会让高位参与低位计算，尽量让下标分布更均匀。

另一个是树化条件。不是链表长度一到 8 就立刻红黑树化，还要看数组长度是不是至少到 64。因为如果数组还很小，优先扩容通常比立刻树化更划算。

最后要补一句线程安全。HashMap 本身不是线程安全的，多线程下不能直接拿来共享写入。这个点不一定每次都被问，但如果自己主动补上，回答会完整很多。

我现在看这题，重点已经不是背流程，而是把“为什么这样设计”讲清楚。面试官真正在意的，通常也不是你记没记住 8 和 64，而是你能不能说明这些数字背后的取舍。`,
  },
  {
    title: "JVM 内存区域怎么答，才能不只是背概念",
    excerpt:
      "把堆、栈、方法区、程序计数器和本地方法栈放到线程私有与线程共享的框架里，整理 JVM 内存区域更稳的回答方式。",
    category: "Java 高频面试",
    tags: ["Java", "JVM", "内存区域", "面试高频"],
    publishedAt: "2026-04-26T14:32:00+08:00",
    viewCount: 94,
    likeCount: 11,
    comments: [],
    markdown: `## JVM 内存区域怎么答，才能不只是背概念

JVM 内存区域这题最容易答得像默写。什么堆、虚拟机栈、方法区、程序计数器，本身不难背，但面试一追问“哪些线程共享、哪些线程私有”，很多人就开始乱。

我现在会先给它分层。

先分成线程私有和线程共享。

线程私有的有三个：程序计数器、虚拟机栈、本地方法栈。线程共享的主要是堆和方法区。

这个分类很重要，因为它直接关系到并发访问和垃圾回收。

堆是最常被提到的部分，因为对象实例大多分配在堆上，GC 也主要围绕堆展开。新生代、老年代这些说法，本质上也是堆内部的分代设计。

虚拟机栈对应方法调用。每次方法执行都会创建一个栈帧，里面有局部变量表、操作数栈、动态链接、方法出口等信息。常说的栈溢出，通常和递归过深或者栈帧过大有关。

程序计数器可以理解成当前线程执行位置的记录器。它占的内存不大，但概念上很关键，因为线程切换回来后要知道下一条指令从哪继续。

方法区经常被讲乱。方法区是 JVM 规范里的概念，HotSpot 在 JDK 8 之后用元空间实现它，不再是永久代。所以如果回答时还把“方法区 = 永久代”直接画等号，容易出错。

本地方法栈和虚拟机栈类似，只是服务对象不同。一个服务 Java 方法，一个服务 native 方法。

如果面试官继续追问，我觉得最值得补的是两个点。

第一，为什么堆是 GC 重点区域。因为对象生命周期不确定，而且对象数量通常最多，所以垃圾回收主要在这里发生。

第二，为什么要强调版本差异。因为 JVM 面试很多坑都来自旧知识没更新，比如永久代、元空间、字符串常量池位置这些细节。

这题真正要避免的是“名词全说了，但没结构”。我现在更愿意先讲线程私有/共享，再讲每块区域职责，最后补一个版本差异，这样会稳很多。`,
  },
  {
    title: "AI Agent 高频面试：Tool Calling、Workflow 和 Autonomous Agent 怎么区分",
    excerpt:
      "从能力边界和控制权角度，梳理 Tool Calling、Workflow Agent 和更自主的 Agent 之间的差异，避免一上来就把 Agent 说成万能体。",
    category: "AI Agent 高频面试",
    tags: ["AI Agent", "Tool Calling", "Workflow", "面试高频"],
    publishedAt: "2026-04-26T14:46:00+08:00",
    viewCount: 102,
    likeCount: 13,
    comments: [
      {
        authorName: "路过的后端",
        content: "这个区分挺有用，之前我一直把 workflow 也叫 agent。",
        createdAt: "2026-04-26T17:05:00+08:00",
      },
    ],
    markdown: `## AI Agent 高频面试：Tool Calling、Workflow 和 Autonomous Agent 怎么区分

最近 AI Agent 的面试题很喜欢上来就问一句：“你怎么理解 Agent？”这个问题如果答成“能自主规划并调用工具完成任务”，不算错，但太笼统了。

我现在更愿意先把几个概念拆开。

第一层是 Tool Calling。它本质上还是大模型主导回答，只不过模型在回答过程中可以请求外部工具，比如搜索、数据库查询、代码执行、发邮件。这里的重点是：**模型会决定什么时候调工具，但整体流程并不复杂。**

第二层是 Workflow。Workflow 更像预先设计好的流程编排，比如先分类问题，再检索知识库，再让模型总结，最后做格式化输出。它不强调“自主性”，强调的是流程稳定、结果可控。

第三层才是更完整意义上的 Agent。这里通常会包含目标拆解、计划生成、工具选择、执行反馈、失败重试，甚至多轮自我修正。Agent 真正难的地方不是“会不会调工具”，而是“能不能在不确定环境里持续推进任务”。

所以如果面试问我三者区别，我会直接说：

- Tool Calling 是模型带工具。
- Workflow 是人预先编排好步骤。
- Agent 是系统在目标驱动下动态决策下一步。

这个区别很重要，因为很多系统其实根本不需要 Autonomous Agent。

比如一个“上传文档后自动总结”的系统，本质上可能只是一个检索 + 总结工作流。你硬把它包装成 Agent，不但没有技术收益，还会把稳定性和成本问题都引进来。

真正适合 Agent 的场景，通常有几个特征：

- 任务目标比较明确，但路径不固定。
- 需要根据中间结果调整下一步策略。
- 要连续调用多个工具。
- 失败后希望系统能自我纠正，而不是直接报错结束。

如果只是固定流程，其实 Workflow 更稳。这个点是我现在最想强调的：**不是接了 LLM 就叫 Agent，也不是会调工具就一定要做 Autonomous Agent。**

很多团队在做 Agent 时，最大的问题不是模型不够强，而是需求本来就适合工作流，却被硬做成了“自主系统”。最后效果不稳定、成本还高。

所以这类面试题我会把回答落在“控制权归谁”上：

- 控制权主要在开发者，叫 Workflow。
- 控制权部分交给模型，叫 Tool Calling。
- 控制权更动态、更依赖运行时决策，才更接近 Agent。

这样回答会比一句“Agent 是智能体”具体得多。`,
  },
  {
    title: "AI Agent 面试里最容易被追问的，是记忆和上下文管理",
    excerpt:
      "从短期上下文、长期记忆、外部存储和状态污染几个角度，整理 AI Agent 系统里记忆设计为什么是高频追问点。",
    category: "AI Agent 高频面试",
    tags: ["AI Agent", "Memory", "Context", "面试高频"],
    publishedAt: "2026-04-26T15:02:00+08:00",
    viewCount: 87,
    likeCount: 9,
    comments: [],
    markdown: `## AI Agent 面试里最容易被追问的，是记忆和上下文管理

AI Agent 这类题，一开始大家都喜欢聊规划、工具调用、自我修正，但真到面试里，很容易被追问到另一个更实际的问题：**上下文和记忆怎么管？**

这是一个很有代表性的点，因为很多 Agent demo 都能跑，但一旦任务变长、步骤变多，系统就开始混乱。不是模型不会，而是上下文已经脏了。

我一般会先区分两类记忆。

一种是短期上下文，也就是当前任务执行时模型能直接看到的内容。比如用户当前问题、最近几步执行结果、工具返回值、当前计划。这些东西通常放在 prompt 或消息历史里。

另一种是长期记忆。比如用户偏好、历史任务、已经确认过的事实、可复用的经验。这些内容不适合一直塞进 prompt，否则 token 成本和噪声都会变高，通常要放到外部存储里，比如数据库、向量库或者结构化状态表。

这里最容易出问题的是边界不清。

如果把什么都当长期记忆，系统会越来越臃肿；如果把什么都塞到当前上下文，模型很快就会被无关信息干扰。真正稳定的做法，通常是只把“当前步骤真正需要的信息”放进上下文，把“可能未来有用的信息”放到外部存储，按需检索。

还有一个高频问题是状态污染。比如一个 Agent 连续做多步任务，前面某一步工具返回错了，后面所有推理都建立在错误结果上。如果系统没有校验和回退机制，错误会一路传下去。

所以我现在看 Agent 里的记忆，不只是“记住东西”，而是三件事：

1. 什么信息应该被保存。
2. 什么时候取回来。
3. 怎么避免旧状态误导当前决策。

如果面试继续追问，我会再补一个工程点：很多所谓“长期记忆”其实不需要向量化。像用户配置、角色权限、任务状态、草稿版本，这些更适合结构化存储。向量检索更适合语义相似内容，而不是所有数据都往里面塞。

这题真正体现工程味的地方就在这：你不能把 memory 只理解成“聊天记录越来越长”。Agent 的上下文管理，本质上是在做信息筛选和状态治理。这个问题如果设计不好，Agent 看起来就会越来越像失忆又健忘的流程机器人。`,
  },
];

async function upsertCategory(name) {
  const slug = toSlug(name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  return existing || prisma.category.create({ data: { name, slug } });
}

async function upsertTag(name) {
  const slug = toSlug(name);
  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  return existing || prisma.tag.create({ data: { name, slug } });
}

async function main() {
  for (const [index, article] of articles.entries()) {
    const category = await upsertCategory(article.category);
    const tags = [];
    for (const tagName of article.tags) {
      tags.push(await upsertTag(tagName));
    }

    const articleSlug = `${SCRIPT_PREFIX}-${String(index + 1).padStart(2, "0")}-${toSlug(article.title)}`.slice(0, 180);
    const publishedAt = new Date(article.publishedAt);
    const contentText = article.markdown
      .replace(/^#+\s+/gm, "")
      .replace(/[*_>`#|-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const existing = await prisma.post.findUnique({
      where: { slug: articleSlug },
      select: { id: true },
    });

    if (existing) {
      await prisma.postTag.deleteMany({ where: { postId: existing.id } });
      await prisma.comment.deleteMany({ where: { postId: existing.id } });

      await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: article.title,
          excerpt: article.excerpt,
          coverImage: DEFAULT_COVER,
          contentMarkdown: article.markdown,
          contentJson: null,
          contentHtml: renderMarkdown(article.markdown),
          contentText,
          status: "PUBLISHED",
          isFeatured: false,
          publishedAt,
          viewCount: article.viewCount,
          likeCount: article.likeCount,
          categoryId: category.id,
          postTags: {
            create: tags.map((tag) => ({
              tag: { connect: { id: tag.id } },
            })),
          },
          comments: {
            create: article.comments.map((comment, commentIndex) => ({
              authorName: comment.authorName,
              content: comment.content,
              floor: commentIndex + 1,
              isAi: false,
              createdAt: new Date(comment.createdAt),
            })),
          },
        },
      });

      console.log(`updated: ${article.title}`);
      continue;
    }

    await prisma.post.create({
      data: {
        title: article.title,
        slug: articleSlug,
        excerpt: article.excerpt,
        coverImage: DEFAULT_COVER,
        contentMarkdown: article.markdown,
        contentJson: null,
        contentHtml: renderMarkdown(article.markdown),
        contentText,
        status: "PUBLISHED",
        isFeatured: false,
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        categoryId: category.id,
        postTags: {
          create: tags.map((tag) => ({
            tag: { connect: { id: tag.id } },
          })),
        },
        comments: {
          create: article.comments.map((comment, commentIndex) => ({
            authorName: comment.authorName,
            content: comment.content,
            floor: commentIndex + 1,
            isAi: false,
            createdAt: new Date(comment.createdAt),
          })),
        },
      },
    });

    console.log(`created: ${article.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
