const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");
const { renderMarkdown } = require("../utils/markdown");
const { toSlug } = require("../utils/slug");
const {
  generateOfficialComment,
  generateExcerpt,
  generateInterviewMarkdown,
} = require("../services/ai-service");
const { createLikeNotification } = require("../services/notification-service");
const { getTodayDateKey, incrementDailyMetric } = require("../utils/daily-metrics");

const router = express.Router();

async function syncTags(postId, tagNames) {
  const tags = [];

  for (const rawName of tagNames) {
    const name = String(rawName || "").trim();
    if (!name) {
      continue;
    }

    const slug = toSlug(name);
    const existing = await prisma.tag.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    });

    const tag = existing
      ? await prisma.tag.update({
          where: { id: existing.id },
          data: { name, slug },
        })
      : await prisma.tag.create({
          data: { name, slug },
        });

    tags.push(tag);
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

async function buildUniqueSlug(title, ignoreId) {
  const baseSlug = toSlug(title);
  let slug = baseSlug;
  let index = 2;

  while (true) {
    const existed = await prisma.post.findUnique({ where: { slug } });
    if (!existed || existed.id === ignoreId) {
      return slug;
    }
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
}

async function deleteAiComment(postId) {
  await prisma.comment.deleteMany({
    where: {
      postId,
      isAi: true,
    },
  });
}

async function refreshAiArtifacts(post, options = {}) {
  const { generateAiComment = false, generateAiInterview = false } = options;

  await prisma.aiReview.deleteMany({
    where: { postId: post.id },
  });

  if (!generateAiComment) {
    await prisma.aiOfficialComment.deleteMany({
      where: { postId: post.id },
    });
    await deleteAiComment(post.id);
  } else {
    const officialComment = await generateOfficialComment(post);

    await prisma.aiOfficialComment.upsert({
      where: { postId: post.id },
      update: { content: officialComment },
      create: {
        postId: post.id,
        content: officialComment,
      },
    });

    const existingAiComment = await prisma.comment.findFirst({
      where: {
        postId: post.id,
        isAi: true,
      },
    });

    if (existingAiComment) {
      await prisma.comment.update({
        where: { id: existingAiComment.id },
        data: { content: officialComment },
      });
    } else {
      const lastComment = await prisma.comment.findFirst({
        where: { postId: post.id },
        orderBy: { floor: "desc" },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          authorName: "AI 博客助手",
          content: officialComment,
          floor: (lastComment?.floor || 0) + 1,
          isAi: true,
        },
      });
    }
  }

  if (!generateAiInterview) {
    await prisma.aiInterview.deleteMany({
      where: { postId: post.id },
    });
  } else {
    const interviewMarkdown = await generateInterviewMarkdown(post);

    await prisma.aiInterview.upsert({
      where: { postId: post.id },
      update: {
        contentMarkdown: interviewMarkdown,
        contentHtml: renderMarkdown(interviewMarkdown),
      },
      create: {
        postId: post.id,
        contentMarkdown: interviewMarkdown,
        contentHtml: renderMarkdown(interviewMarkdown),
      },
    });
  }
}

function mapPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    contentMarkdown: post.contentMarkdown,
    contentJson: post.contentJson,
    contentHtml: post.contentHtml,
    contentText: post.contentText,
    category: post.category,
    tags: post.postTags.map((item) => item.tag),
    aiOfficialComment: post.aiOfficialComment,
    aiInterview: post.aiInterview,
    commentCount: post.comments.length,
    comments: post.comments,
  };
}

async function buildPostPayload(body, ignoreId) {
  const title = String(body.title || "").trim();
  const contentHtml = String(body.contentHtml || "").trim();
  const contentText = String(body.contentText || "").trim();
  const contentJson =
    typeof body.contentJson === "string"
      ? body.contentJson
      : body.contentJson
        ? JSON.stringify(body.contentJson)
        : null;
  const contentMarkdown = String(body.contentMarkdown || contentText || "").trim();
  const categoryId = Number(body.categoryId);
  const coverImage = String(body.coverImage || "").trim() || null;
  const rawViewCount = Number(body.viewCount);
  const rawLikeCount = Number(body.likeCount);
  const viewCount = Number.isFinite(rawViewCount) ? Math.max(0, Math.floor(rawViewCount)) : 0;
  const likeCount = Number.isFinite(rawLikeCount) ? Math.max(0, Math.floor(rawLikeCount)) : 0;
  const requestedPublishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : null;
  const publishedAt =
    requestedPublishedAt && !Number.isNaN(requestedPublishedAt.getTime())
      ? requestedPublishedAt
      : null;
  const requestedExcerpt = String(body.excerpt || "").trim();
  const excerpt =
    requestedExcerpt ||
    (title && (contentText || contentMarkdown)
      ? await generateExcerpt({ title, contentMarkdown: contentText || contentMarkdown })
      : "");

  if (!title || !(contentHtml || contentMarkdown || contentText) || !categoryId) {
    return {
      error: "文章标题、正文和分类不能为空",
    };
  }

  return {
    title,
    excerpt,
    coverImage,
    contentMarkdown,
    contentJson,
    contentHtml: contentHtml || renderMarkdown(contentMarkdown),
    contentText,
    categoryId,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    viewCount,
    likeCount,
    publishedAt,
    generateAiComment: body.generateAiComment === true,
    generateAiInterview: body.generateAiInterview === true,
    slug: await buildUniqueSlug(title, ignoreId),
  };
}

async function fetchFullPost(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: true,
      postTags: { include: { tag: true } },
      aiReview: true,
      aiOfficialComment: true,
      aiInterview: true,
      comments: true,
    },
  });
}

router.get("/", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();
  const archive = String(req.query.archive || "").trim();
  const includeDrafts = req.query.includeDrafts === "true";

  const where = {
    ...(includeDrafts ? {} : { status: "PUBLISHED" }),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { contentText: { contains: search } },
            { contentMarkdown: { contains: search } },
          ],
        }
      : {}),
    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    ...(archive
      ? {
          publishedAt: {
            gte: new Date(`${archive}-01T00:00:00.000Z`),
            lt: new Date(
              new Date(`${archive}-01T00:00:00.000Z`).setMonth(
                new Date(`${archive}-01T00:00:00.000Z`).getMonth() + 1
              )
            ),
          },
        }
      : {}),
  };

  const posts = await prisma.post.findMany({
    where,
    include: {
      category: true,
      postTags: { include: { tag: true } },
      aiReview: true,
      aiOfficialComment: true,
      aiInterview: true,
      comments: true,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  res.json(posts.map(mapPost));
});

router.get("/archives", async (_req, res) => {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    select: { publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const archiveMap = new Map();

  for (const post of posts) {
    const key = post.publishedAt.toISOString().slice(0, 7);
    archiveMap.set(key, (archiveMap.get(key) || 0) + 1);
  }

  res.json(
    Array.from(archiveMap.entries()).map(([month, count]) => ({
      month,
      count,
    }))
  );
});

router.get("/:slug", async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      postTags: { include: { tag: true } },
      aiReview: true,
      aiOfficialComment: true,
      aiInterview: true,
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).json({ message: "文章不存在" });
  }

  res.json(mapPost(post));
});

router.patch("/:id/view", async (req, res) => {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId)) {
    return res.status(400).json({ message: "文章 ID 不正确" });
  }

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  });

  if (!existing || existing.status !== "PUBLISHED") {
    return res.status(404).json({ message: "文章不存在" });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
    select: { id: true, viewCount: true },
  });

  await incrementDailyMetric(getTodayDateKey(), {
    viewIncrement: { increment: 1 },
  });

  res.json(updated);
});

router.patch("/:id/like", async (req, res) => {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId)) {
    return res.status(400).json({ message: "文章 ID 不正确" });
  }

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true, title: true },
  });

  if (!existing || existing.status !== "PUBLISHED") {
    return res.status(404).json({ message: "文章不存在" });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { likeCount: { increment: 1 } },
    select: { id: true, likeCount: true },
  });

  await createLikeNotification({
    id: existing.id,
    title: existing.title,
    likeCount: updated.likeCount,
  });
  await incrementDailyMetric(getTodayDateKey(), {
    likeIncrement: { increment: 1 },
  });

  res.json(updated);
});

router.post("/", requireAdmin, async (req, res) => {
  const payload = await buildPostPayload(req.body || {});

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const isPublished = payload.status === "PUBLISHED";
  const post = await prisma.post.create({
    data: {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      coverImage: payload.coverImage,
      contentMarkdown: payload.contentMarkdown,
      contentJson: payload.contentJson,
      contentHtml: payload.contentHtml,
      contentText: payload.contentText,
      categoryId: payload.categoryId,
      viewCount: payload.viewCount,
      likeCount: payload.likeCount,
      status: payload.status,
      publishedAt: isPublished ? payload.publishedAt || new Date() : null,
    },
  });

  await syncTags(post.id, payload.tags);

  const fullPost = await fetchFullPost(post.id);
  await refreshAiArtifacts(fullPost, {
    generateAiComment: payload.generateAiComment,
    generateAiInterview: payload.generateAiInterview,
  });

  const finalPost = await fetchFullPost(post.id);
  await incrementDailyMetric(getTodayDateKey(post.createdAt), {
    postIncrement: { increment: 1 },
  });
  res.json(mapPost(finalPost));
});

router.put("/:id", requireAdmin, async (req, res) => {
  const postId = Number(req.params.id);
  const existing = await prisma.post.findUnique({ where: { id: postId } });

  if (!existing) {
    return res.status(404).json({ message: "文章不存在" });
  }

  const payload = await buildPostPayload(req.body || {}, postId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const isPublished = payload.status === "PUBLISHED";
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      coverImage: payload.coverImage,
      contentMarkdown: payload.contentMarkdown,
      contentJson: payload.contentJson,
      contentHtml: payload.contentHtml,
      contentText: payload.contentText,
      categoryId: payload.categoryId,
      viewCount: payload.viewCount,
      likeCount: payload.likeCount,
      status: payload.status,
      publishedAt: isPublished ? payload.publishedAt || existing.publishedAt || new Date() : null,
    },
  });

  await syncTags(post.id, payload.tags);

  const fullPost = await fetchFullPost(post.id);
  await refreshAiArtifacts(fullPost, {
    generateAiComment: payload.generateAiComment,
    generateAiInterview: payload.generateAiInterview,
  });

  const finalPost = await fetchFullPost(post.id);
  res.json(mapPost(finalPost));
});

router.patch("/:id/status", requireAdmin, async (req, res) => {
  const postId = Number(req.params.id);
  const status = req.body?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return res.status(404).json({ message: "文章不存在" });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status,
      isFeatured: status === "PUBLISHED" ? existing.isFeatured : false,
      publishedAt: status === "PUBLISHED" ? existing.publishedAt || new Date() : null,
    },
  });

  const fullPost = await fetchFullPost(updated.id);
  res.json(mapPost(fullPost));
});

router.patch("/:id/featured", requireAdmin, async (req, res) => {
  const postId = Number(req.params.id);
  const isFeatured = req.body?.isFeatured === true;

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return res.status(404).json({ message: "文章不存在" });
  }

  if (isFeatured && existing.status !== "PUBLISHED") {
    return res.status(400).json({ message: "只有已发布文章可以置顶到首页" });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { isFeatured },
  });

  const fullPost = await fetchFullPost(updated.id);
  res.json(mapPost(fullPost));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.post.delete({
    where: { id: Number(req.params.id) },
  });

  res.json({ success: true });
});

module.exports = router;
