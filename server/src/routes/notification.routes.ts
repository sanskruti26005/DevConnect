import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', async (_req, res) => {
  try {
    const userId = res.locals.userId as string;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ success: true, data: notifications, message: 'Notifications fetched successfully' });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch notifications' });
  }
});

router.patch('/read-all', async (_req, res) => {
  try {
    const userId = res.locals.userId as string;
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update notifications' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId },
      data: { isRead: true }
    });
    if (!result.count) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update notification' });
  }
});

export default router;
