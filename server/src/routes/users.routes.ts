import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// Search public developer profiles. Password hashes and email addresses are never returned.
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
            { skills: { has: search } }
          ]
        } : {})
      },
      select: {
        id: true, name: true, bio: true, location: true,
        profileImage: true, skills: true,
        _count: { select: { projects: true, posts: true, endorsementsReceived: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 40
    });

    const relationships = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: users.map((user) => user.id) } },
          { receiverId: userId, senderId: { in: users.map((user) => user.id) } }
        ]
      },
      select: { id: true, senderId: true, receiverId: true, status: true }
    });

    const data = users.map((user) => {
      const relationship = relationships.find((item) =>
        (item.senderId === userId && item.receiverId === user.id) ||
        (item.receiverId === userId && item.senderId === user.id)
      );
      return {
        ...user,
        connectionStatus: relationship?.status ?? null,
        connectionId: relationship?.id ?? null,
        requestSentByMe: relationship?.senderId === userId
      };
    });

    return res.json({ success: true, data, message: 'Developers fetched successfully' });
  } catch (error) {
    console.error('Search developers error:', error);
    return res.status(500).json({ success: false, message: 'Unable to search developers' });
  }
});

export default router;
