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
  profileName: "何晨旭",
  profileTagline: "后端开发 / Java 工程实践 / 长期写作者",
  profileImage:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
};

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
  const {
    siteTitle,
    heroTitle,
    heroDescription,
    heroImage,
    profileName,
    profileTagline,
    profileImage,
  } = req.body || {};

  const requiredFields = {
    siteTitle,
    heroTitle,
    heroDescription,
    profileName,
    profileTagline,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value || !String(value).trim()) {
      return res.status(400).json({ message: `${key} 不能为空` });
    }
  }

  const settings = await prisma.siteSetting.upsert({
    where: { id: "site" },
    update: {
      siteTitle: String(siteTitle).trim(),
      heroTitle: String(heroTitle).trim(),
      heroDescription: String(heroDescription).trim(),
      heroImage: String(heroImage || "").trim() || null,
      profileName: String(profileName).trim(),
      profileTagline: String(profileTagline).trim(),
      profileImage: String(profileImage || "").trim() || null,
    },
    create: {
      id: "site",
      siteTitle: String(siteTitle).trim(),
      heroTitle: String(heroTitle).trim(),
      heroDescription: String(heroDescription).trim(),
      heroImage: String(heroImage || "").trim() || null,
      profileName: String(profileName).trim(),
      profileTagline: String(profileTagline).trim(),
      profileImage: String(profileImage || "").trim() || null,
    },
  });

  res.json(settings);
});

module.exports = router;
