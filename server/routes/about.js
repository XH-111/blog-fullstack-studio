const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");

const router = express.Router();

const defaultAboutProfile = {
  id: "about",
  introTitle: "个人简介",
  introBody:
    "这里可以写你的性格、写作方向、长期目标和你希望别人怎样认识你。内容支持换行，适合写成一段有温度的个人介绍。",
  skills: "Java\nJVM\nSpring Boot\nNext.js\nExpress\nPrisma\nSQLite",
  experiences:
    "2024｜开始系统整理 Java 与后端工程笔记\n2025｜搭建个人博客，沉淀项目复盘与生活记录\n2026｜继续扩展知识库、留言板和后台内容管理",
  projects:
    "个人博客｜一个支持知识库、富文本写作、留言板、点赞与后台管理的全栈博客｜Next.js / Express / Prisma / SQLite｜/knowledge",
  honors: "[]",
};

function normalizeAboutPayload(body = {}) {
  return {
    introTitle: String(body.introTitle || "").trim(),
    introBody: String(body.introBody || "").trim(),
    skills: String(body.skills || "").trim(),
    experiences: String(body.experiences || "").trim(),
    projects: String(body.projects || "").trim(),
    honors: String(body.honors || "[]").trim() || "[]",
  };
}

async function getOrCreateAboutProfile() {
  return prisma.aboutProfile.upsert({
    where: { id: "about" },
    update: {},
    create: defaultAboutProfile,
  });
}

router.get("/", async (_req, res) => {
  const profile = await getOrCreateAboutProfile();
  res.json(profile);
});

router.put("/", requireAdmin, async (req, res) => {
  const payload = normalizeAboutPayload(req.body);

  const requiredFields = {
    introTitle: payload.introTitle,
    introBody: payload.introBody,
    skills: payload.skills,
    experiences: payload.experiences,
    projects: payload.projects,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      return res.status(400).json({ message: `${key} 不能为空` });
    }
  }

  try {
    const parsedHonors = JSON.parse(payload.honors);
    if (!Array.isArray(parsedHonors)) {
      return res.status(400).json({ message: "荣誉照片墙格式不正确" });
    }
  } catch (_error) {
    return res.status(400).json({ message: "荣誉照片墙格式不正确" });
  }

  const profile = await prisma.aboutProfile.upsert({
    where: { id: "about" },
    update: payload,
    create: {
      id: "about",
      ...payload,
    },
  });

  res.json(profile);
});

module.exports = router;
