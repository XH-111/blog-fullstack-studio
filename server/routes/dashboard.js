const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../utils/auth");
const { mapNotification } = require("../services/notification-service");
const { getTodayDateKey } = require("../utils/daily-metrics");

const router = express.Router();

router.get("/summary", requireAdmin, async (_req, res) => {
  const [postCount, commentCount, categoryCount, tagCount, unreadNotificationCount, aggregates, todayMetric] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.post.aggregate({
      _sum: {
        viewCount: true,
        likeCount: true,
      },
    }),
    prisma.dailyMetric.findUnique({
      where: { dateKey: getTodayDateKey() },
    }),
  ]);

  res.json({
    postCount,
    commentCount,
    categoryCount,
    tagCount,
    unreadNotificationCount,
    totalViewCount: aggregates._sum.viewCount || 0,
    totalLikeCount: aggregates._sum.likeCount || 0,
    todayPostCount: todayMetric?.postIncrement || 0,
    todayViewCount: todayMetric?.viewIncrement || 0,
    todayLikeCount: todayMetric?.likeIncrement || 0,
  });
});

router.get("/notifications", requireAdmin, async (_req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
        comment: {
          select: { id: true, authorName: true, floor: true, parentId: true },
        },
        guestbookMessage: {
          select: { id: true, authorName: true, isPrivate: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  res.json({
    unreadCount,
    notifications: notifications.map(mapNotification),
  });
});

router.patch("/notifications/read-all", requireAdmin, async (_req, res) => {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true });
});

router.patch("/notifications/:id/read", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "消息 ID 无效" });
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
    include: {
      post: {
        select: { id: true, title: true, slug: true },
      },
      comment: {
        select: { id: true, authorName: true, floor: true, parentId: true },
      },
      guestbookMessage: {
        select: { id: true, authorName: true, isPrivate: true },
      },
    },
  });

  res.json(mapNotification(notification));
});

module.exports = router;
