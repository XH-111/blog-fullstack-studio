const express = require("express");
const { prisma } = require("../db");

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
  const { postId, authorName, email, content } = req.body || {};

  if (!postId || !authorName || !content) {
    return res.status(400).json({ message: "评论参数不完整" });
  }

  const lastComment = await prisma.comment.findFirst({
    where: { postId: Number(postId) },
    orderBy: { floor: "desc" },
  });

  const comment = await prisma.comment.create({
    data: {
      postId: Number(postId),
      authorName,
      email: email || null,
      content,
      floor: (lastComment?.floor || 0) + 1,
    },
  });

  res.json(comment);
});

module.exports = router;
