const express = require("express");
const { prisma } = require("../db");

const router = express.Router();

function parseTagCounts(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function serializeReaction(reaction) {
  return {
    id: reaction.id,
    total: reaction.total,
    tagCounts: parseTagCounts(reaction.tagCounts),
    updatedAt: reaction.updatedAt,
  };
}

async function getOrCreateReaction() {
  return prisma.homeReaction.upsert({
    where: { id: "home" },
    update: {},
    create: { id: "home" },
  });
}

router.get("/", async (_req, res) => {
  const reaction = await getOrCreateReaction();
  res.json(serializeReaction(reaction));
});

router.post("/", async (req, res) => {
  const tag = String(req.body?.tag || "").trim().slice(0, 32);

  if (!tag) {
    return res.status(400).json({ message: "标签不能为空" });
  }

  const reaction = await getOrCreateReaction();
  const tagCounts = parseTagCounts(reaction.tagCounts);
  tagCounts[tag] = Number(tagCounts[tag] || 0) + 1;

  const updated = await prisma.homeReaction.update({
    where: { id: "home" },
    data: {
      total: { increment: 1 },
      tagCounts: JSON.stringify(tagCounts),
    },
  });

  res.json(serializeReaction(updated));
});

module.exports = router;
