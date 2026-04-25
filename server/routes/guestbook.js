const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");

const router = express.Router();
const maxMessageLength = 100;

function normalizeMessage(body = {}) {
  return {
    authorName: String(body.authorName || "匿名访客").trim().slice(0, 24) || "匿名访客",
    content: String(body.content || "").trim(),
    isPrivate: body.isPrivate === true,
  };
}

function toPublicMessage(message) {
  return {
    id: message.id,
    authorName: message.authorName,
    content: message.content,
    isPrivate: message.isPrivate,
    replyContent: message.replyContent,
    repliedAt: message.repliedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

router.get("/", async (_req, res) => {
  const messages = await prisma.guestbookMessage.findMany({
    where: { isPrivate: false },
    orderBy: { createdAt: "desc" },
  });

  res.json(messages.map(toPublicMessage));
});

router.get("/admin", requireAdmin, async (_req, res) => {
  const messages = await prisma.guestbookMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(messages.map(toPublicMessage));
});

router.post("/", async (req, res) => {
  const payload = normalizeMessage(req.body);

  if (!payload.content) {
    return res.status(400).json({ message: "留言内容不能为空" });
  }

  if (payload.content.length > maxMessageLength) {
    return res.status(400).json({ message: `留言最多 ${maxMessageLength} 字` });
  }

  const message = await prisma.guestbookMessage.create({
    data: payload,
  });

  res.json(toPublicMessage(message));
});

router.patch("/:id/reply", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const replyContent = String(req.body?.replyContent || "").trim();

  if (!id) {
    return res.status(400).json({ message: "留言 ID 无效" });
  }

  if (replyContent.length > maxMessageLength) {
    return res.status(400).json({ message: `回复最多 ${maxMessageLength} 字` });
  }

  const message = await prisma.guestbookMessage.update({
    where: { id },
    data: {
      replyContent: replyContent || null,
      repliedAt: replyContent ? new Date() : null,
    },
  });

  res.json(toPublicMessage(message));
});

module.exports = router;
