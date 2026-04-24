const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../db");
const { signAdminToken, requireAdmin } = require("../utils/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

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

router.get("/me", requireAdmin, async (req, res) => {
  return res.json({ admin: req.admin });
});

module.exports = router;
