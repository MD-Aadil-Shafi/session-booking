import { prisma } from "@/config/prisma.js"

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

export async function markAsRead(
  notificationId: string,
  userId: string
) {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  if (!result.count) {
    throw new Error("Notification not found or already read");
  }

  return { message: "Notification marked as read" };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}