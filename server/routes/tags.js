const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");
const { toSlug } = require("../utils/slug");

const router = express.Router();

router.get("/", async (_req, res) => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { postTags: true },
      },
    },
  });
  res.json(tags);
});

router.post("/", requireAdmin, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "标签名称不能为空" });
  }

  const slug = toSlug(name);
  const existed = await prisma.tag.findUnique({ where: { slug } });
  if (existed) {
    return res.status(409).json({ message: "标签已存在" });
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      slug,
    },
  });
  res.json(tag);
});

module.exports = router;
