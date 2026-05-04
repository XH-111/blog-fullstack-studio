const { prisma } = require("../db");

function truncate(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

async function createLikeNotification(post) {
  return prisma.notification.create({
    data: {
      type: "LIKE",
      title: `《${post.title}》收到了新的点赞`,
      content: `当前累计 ${post.likeCount} 次点赞。`,
      postId: post.id,
    },
  });
}

async function createCommentNotification({ comment, post, parentComment }) {
  const replyPrefix = parentComment ? `回复了 ${parentComment.authorName}：` : "评论了文章：";

  return prisma.notification.create({
    data: {
      type: "COMMENT",
      title: `${comment.authorName} 在《${post.title}》下发表了评论`,
      content: `${replyPrefix}${truncate(comment.content, 96)}`,
      postId: post.id,
      commentId: comment.id,
    },
  });
}

async function createGuestbookNotification(message) {
  return prisma.notification.create({
    data: {
      type: "GUESTBOOK",
      title: `${message.authorName} 留下了一条${message.isPrivate ? "私密" : "公开"}留言`,
      content: truncate(message.content, 96),
      guestbookMessageId: message.id,
    },
  });
}

function mapNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    post: notification.post
      ? {
          id: notification.post.id,
          title: notification.post.title,
          slug: notification.post.slug,
        }
      : null,
    comment: notification.comment
      ? {
          id: notification.comment.id,
          authorName: notification.comment.authorName,
          floor: notification.comment.floor,
          parentId: notification.comment.parentId,
        }
      : null,
    guestbookMessage: notification.guestbookMessage
      ? {
          id: notification.guestbookMessage.id,
          authorName: notification.guestbookMessage.authorName,
          isPrivate: notification.guestbookMessage.isPrivate,
        }
      : null,
  };
}

module.exports = {
  createLikeNotification,
  createCommentNotification,
  createGuestbookNotification,
  mapNotification,
};
