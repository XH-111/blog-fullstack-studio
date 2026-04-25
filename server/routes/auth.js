const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../db");
const { sendMail } = require("../services/mail-service");
const { signAdminToken, requireAdmin } = require("../utils/auth");

const router = express.Router();
const resetCodeMinutes = 10;

function normalizeUsername(value) {
  return String(value || "").trim();
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8) {
    return "新密码至少需要 8 位";
  }
  return "";
}

function createResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: "账号或密码错误" });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return res.status(401).json({ message: "账号或密码错误" });
  }

  return res.json({
    token: signAdminToken(user),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
});

router.patch("/password", requireAdmin, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  const validationError = validatePassword(newPassword);

  if (!currentPassword || validationError) {
    return res.status(400).json({ message: validationError || "当前密码不能为空" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.admin.userId } });
  if (!user) {
    return res.status(404).json({ message: "管理员不存在" });
  }

  const matched = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matched) {
    return res.status(401).json({ message: "当前密码错误" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  res.json({ success: true });
});

router.post("/forgot-password", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const genericMessage = "如果账号存在，验证码会发送到管理员邮箱。";

  if (!username) {
    return res.status(400).json({ message: "请输入用户名" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.json({ message: genericMessage });
  }

  const resetEmail = process.env.ADMIN_RESET_EMAIL;
  if (!resetEmail) {
    return res.status(500).json({ message: "未配置 ADMIN_RESET_EMAIL" });
  }

  const code = createResetCode();
  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + resetCodeMinutes * 60 * 1000),
    },
  });

  await sendMail({
    to: resetEmail,
    subject: "博客后台密码重置验证码",
    text: `你的博客后台密码重置验证码是：${code}\n\n验证码 ${resetCodeMinutes} 分钟内有效。如果不是你本人操作，请忽略这封邮件。`,
  });

  res.json({ message: genericMessage });
});

router.post("/reset-password", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const code = String(req.body?.code || "").trim();
  const newPassword = String(req.body?.newPassword || "");
  const validationError = validatePassword(newPassword);

  if (!username || !code || validationError) {
    return res.status(400).json({ message: validationError || "用户名和验证码不能为空" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(400).json({ message: "验证码无效或已过期" });
  }

  const resetRecord = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resetRecord) {
    return res.status(400).json({ message: "验证码无效或已过期" });
  }

  const matched = await bcrypt.compare(code, resetRecord.codeHash);
  if (!matched) {
    return res.status(400).json({ message: "验证码无效或已过期" });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    }),
    prisma.passwordResetCode.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ success: true });
});

router.get("/me", requireAdmin, async (req, res) => {
  return res.json({ admin: req.admin });
});

module.exports = router;
