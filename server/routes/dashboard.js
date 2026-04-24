const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");

const router = express.Router();

router.get("/summary", requireAdmin, async (_req, res) => {
  const [postCount, commentCount, categoryCount, tagCount] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count(),
    prisma.category.count(),
    prisma.tag.count(),
  ]);

  res.json({ postCount, commentCount, categoryCount, tagCount });
});

module.exports = router;
