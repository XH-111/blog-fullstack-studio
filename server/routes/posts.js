const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");
const { renderMarkdown } = require("../utils/markdown");
const { toSlug } = require("../utils/slug");
const {
  generateOfficialComment,
  generateExcerpt,
} = require("../services/ai-service");

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
  const { generateAiComment = false } = options;

  await prisma.aiReview.deleteMany({
    where: { postId: post.id },
  });

  if (!generateAiComment) {
    await prisma.aiOfficialComment.deleteMany({
      where: { postId: post.id },
    });
    await deleteAiComment(post.id);
    return;
  }

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
    return;
  }

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

function mapPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    contentMarkdown: post.contentMarkdown,
    contentHtml: post.contentHtml,
    category: post.category,
    tags: post.postTags.map((item) => item.tag),
    aiOfficialComment: post.aiOfficialComment,
    commentCount: post.comments.length,
    comments: post.comments,
  };
}

async function buildPostPayload(body, ignoreId) {
  const title = String(body.title || "").trim();
  const contentMarkdown = String(body.contentMarkdown || "").trim();
  const categoryId = Number(body.categoryId);
  const coverImage = String(body.coverImage || "").trim() || null;
  const requestedExcerpt = String(body.excerpt || "").trim();
  const excerpt =
    requestedExcerpt ||
    (title && contentMarkdown
      ? await generateExcerpt({ title, contentMarkdown })
      : "");

  if (!title || !contentMarkdown || !categoryId) {
    return {
      error: "文章标题、正文和分类不能为空",
    };
  }

  return {
    title,
    excerpt,
    coverImage,
    contentMarkdown,
    categoryId,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    generateAiComment: body.generateAiComment === true,
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
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).json({ message: "文章不存在" });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  res.json(mapPost(post));
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
      contentHtml: renderMarkdown(payload.contentMarkdown),
      categoryId: payload.categoryId,
      status: payload.status,
      publishedAt: isPublished ? new Date() : null,
    },
  });

  await syncTags(post.id, payload.tags);

  const fullPost = await fetchFullPost(post.id);
  await refreshAiArtifacts(fullPost, {
    generateAiComment: payload.generateAiComment,
  });

  const finalPost = await fetchFullPost(post.id);
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
      contentHtml: renderMarkdown(payload.contentMarkdown),
      categoryId: payload.categoryId,
      status: payload.status,
      publishedAt: isPublished ? existing.publishedAt || new Date() : null,
    },
  });

  await syncTags(post.id, payload.tags);

  const fullPost = await fetchFullPost(post.id);
  await refreshAiArtifacts(fullPost, {
    generateAiComment: payload.generateAiComment,
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
      publishedAt:
        status === "PUBLISHED" ? existing.publishedAt || new Date() : null,
    },
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
