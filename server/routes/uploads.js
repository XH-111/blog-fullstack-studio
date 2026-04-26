const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const { requireAdmin } = require("../utils/auth");
const { toSlug } = require("../utils/slug");

const router = express.Router();

const ALLOWED_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
]);

router.post("/image", requireAdmin, async (req, res) => {
  const fileName = String(req.body?.fileName || "").trim();
  const contentType = String(req.body?.contentType || "").trim().toLowerCase();
  const dataUrl = String(req.body?.dataUrl || "");

  if (!fileName || !contentType || !dataUrl) {
    return res.status(400).json({ message: "图片信息不完整" });
  }

  const extension = ALLOWED_TYPES.get(contentType);
  if (!extension) {
    return res.status(400).json({ message: "暂不支持该图片格式" });
  }

  const match = dataUrl.match(/^data:([\w.+-]+\/[\w.+-]+);base64,(.+)$/);
  if (!match || match[1].toLowerCase() !== contentType) {
    return res.status(400).json({ message: "图片数据格式不正确" });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0) {
    return res.status(400).json({ message: "图片内容为空" });
  }

  const maxBytes = 20 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    return res.status(400).json({ message: "图片不能超过 20MB" });
  }

  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const uploadRoot = path.join(process.cwd(), "public", "uploads", "posts", year, month);
  await fs.mkdir(uploadRoot, { recursive: true });

  const baseName = fileName.replace(/\.[^.]+$/, "") || "image";
  const safeName = toSlug(baseName);
  const finalName = `${Date.now()}-${safeName}${extension}`;
  const finalPath = path.join(uploadRoot, finalName);

  await fs.writeFile(finalPath, buffer);

  res.json({
    url: `/uploads/posts/${year}/${month}/${finalName}`,
  });
});

module.exports = router;
