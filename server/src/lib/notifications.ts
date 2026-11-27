import { prisma } from './prisma.js';

export async function createNotification(userId: string, type: string, message: string) {
  return prisma.notification.create({
    data: { userId, type, message }
  });
}
