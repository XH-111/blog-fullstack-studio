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

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "标签名称不能为空" });
  }

  const normalizedName = String(name).trim();
  const slug = toSlug(normalizedName);
  const existed = await prisma.tag.findFirst({
    where: {
      OR: [{ slug }, { name: normalizedName }],
    },
  });

  if (existed) {
    return res.status(409).json({ message: "这个标签已经存在" });
  }

  const tag = await prisma.tag.create({
    data: {
      name: normalizedName,
      slug,
    },
  });

  res.json(tag);
});

module.exports = router;
