const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");

const router = express.Router();

const defaultSettings = {
  id: "site",
  siteTitle: "POETIZE",
  heroTitle: "生活与技术的温柔归档",
  heroDescription:
    "长期记录 Java、JVM、工程实践与个人项目，把技术写成可以反复回看的作品。",
  heroImage:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
  welcomeEyebrow: "欢迎光临",
  welcomeTitle: "一套可以长期写作、持续扩展、适合沉淀技术与生活的个人博客",
  welcomeBody:
    "这里会持续更新 Java、JVM、后端工程实践、项目复盘和个人成长记录。它不是只展示结果的站点，而是一份长期可读的个人工程档案。",
  welcomeTags: "简洁首页,后台写作,分类管理,Markdown 编辑,AI 正确性评论,JVM 专栏",
  profileName: "何醒辉",
  profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
  profileImage:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
};

function normalizeSettingsPayload(body = {}) {
  return {
    siteTitle: String(body.siteTitle || "").trim(),
    heroTitle: String(body.heroTitle || "").trim(),
    heroDescription: String(body.heroDescription || "").trim(),
    heroImage: String(body.heroImage || "").trim() || null,
    welcomeEyebrow: String(body.welcomeEyebrow || defaultSettings.welcomeEyebrow).trim(),
    welcomeTitle: String(body.welcomeTitle || "").trim(),
    welcomeBody: String(body.welcomeBody || "").trim(),
    welcomeTags: String(body.welcomeTags || "").trim(),
    profileName: String(body.profileName || "").trim(),
    profileTagline: String(body.profileTagline || "").trim(),
    profileImage: String(body.profileImage || "").trim() || null,
  };
}

async function getOrCreateSettings() {
  return prisma.siteSetting.upsert({
    where: { id: "site" },
    update: {},
    create: defaultSettings,
  });
}

router.get("/", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

router.put("/", requireAdmin, async (req, res) => {
  const payload = normalizeSettingsPayload(req.body);
  const requiredFields = {
    siteTitle: payload.siteTitle,
    heroTitle: payload.heroTitle,
    heroDescription: payload.heroDescription,
    welcomeTitle: payload.welcomeTitle,
    welcomeBody: payload.welcomeBody,
    welcomeTags: payload.welcomeTags,
    profileName: payload.profileName,
    profileTagline: payload.profileTagline,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      return res.status(400).json({ message: `${key} 不能为空` });
    }
  }

  const settings = await prisma.siteSetting.upsert({
    where: { id: "site" },
    update: payload,
    create: {
      id: "site",
      ...payload,
    },
  });

  res.json(settings);
});

module.exports = router;
