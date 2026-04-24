const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");
const { toSlug } = require("../utils/slug");

const router = express.Router();

router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });
  res.json(categories);
});

router.post("/", requireAdmin, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "分类名称不能为空" });
  }

  const slug = toSlug(name);
  const existed = await prisma.category.findUnique({ where: { slug } });
  if (existed) {
    return res.status(409).json({ message: "分类已存在" });
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
    },
  });

  res.json(category);
});

module.exports = router;
