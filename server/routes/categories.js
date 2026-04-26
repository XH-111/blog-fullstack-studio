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

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "分类名称不能为空" });
  }

  const normalizedName = String(name).trim();
  const slug = toSlug(normalizedName);

  const existed = await prisma.category.findFirst({
    where: {
      OR: [{ slug }, { name: normalizedName }],
    },
  });

  if (existed) {
    return res.status(409).json({ message: "这个分类已经存在" });
  }

  const category = await prisma.category.create({
    data: {
      name: normalizedName,
      slug,
    },
  });

  res.json(category);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);

  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ message: "分类 ID 不正确" });
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ message: "分类不存在" });
  }

  if ((existing._count?.posts || 0) > 0) {
    return res.status(400).json({ message: "该分类下还有文章，不能直接删除" });
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  res.json({ success: true });
});

module.exports = router;
