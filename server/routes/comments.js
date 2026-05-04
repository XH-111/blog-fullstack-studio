const express = require("express");
const { prisma } = require("../db");
const { createCommentNotification } = require("../services/notification-service");
const { extractBearerToken, verifyAdminToken } = require("../utils/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const postId = Number(req.query.postId || 0);
  if (!postId) {
    return res.status(400).json({ message: "缺少文章 ID" });
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });
  res.json(comments);
});

router.post("/", async (req, res) => {
  const { postId, authorName, email, content, parentId } = req.body || {};
  const token = extractBearerToken(req);
  let admin = null;

  if (token) {
    try {
      admin = verifyAdminToken(token);
    } catch (_error) {
      admin = null;
    }
  }

  if (!postId || !(admin || authorName) || !content) {
    return res.status(400).json({ message: "评论内容不能为空" });
  }

  const normalizedPostId = Number(postId);
  const normalizedParentId = parentId ? Number(parentId) : null;

  const post = await prisma.post.findUnique({
    where: { id: normalizedPostId },
    select: { id: true, title: true, slug: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).json({ message: "文章不存在" });
  }

  let parentComment = null;

  if (normalizedParentId) {
    parentComment = await prisma.comment.findUnique({
      where: { id: normalizedParentId },
    });

    if (!parentComment || parentComment.postId !== normalizedPostId) {
      return res.status(400).json({ message: "回复目标评论不存在" });
    }
  }

  const lastComment = await prisma.comment.findFirst({
    where: { postId: normalizedPostId },
    orderBy: { floor: "desc" },
  });

  const comment = await prisma.comment.create({
    data: {
      postId: normalizedPostId,
      parentId: normalizedParentId,
      authorName: admin?.displayName || authorName,
      email: admin ? null : email || null,
      content,
      floor: (lastComment?.floor || 0) + 1,
      isAdmin: Boolean(admin),
    },
  });

  await createCommentNotification({
    comment,
    post,
    parentComment,
  });

  res.json(comment);
});

module.exports = router;
