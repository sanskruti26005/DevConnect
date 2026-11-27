import { Router } from 'express';
import { ConnectionStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../lib/notifications.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', async (_req, res) => {
  try {
    const userId = res.locals.userId as string;
    const connections = await prisma.connection.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, name: true, bio: true, location: true, skills: true } },
        receiver: { select: { id: true, name: true, bio: true, location: true, skills: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: connections, message: 'Connections fetched successfully' });
  } catch (error) {
    console.error('Fetch connections error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch connections' });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const senderId = res.locals.userId as string;
    const receiverId = req.params.userId as string;
    if (senderId === receiverId) return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, name: true } });
    if (!receiver) return res.status(404).json({ success: false, message: 'Developer not found' });

    const existing = await prisma.connection.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] }
    });
    if (existing) return res.status(409).json({ success: false, message: 'A connection request or connection already exists' });

    const connection = await prisma.connection.create({ data: { senderId, receiverId } });
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
    await createNotification(receiverId, 'CONNECTION_REQUEST', `${sender?.name ?? 'A developer'} sent you a connection request.`);
    return res.status(201).json({ success: true, data: connection, message: 'Connection request sent' });
  } catch (error) {
    console.error('Send connection request error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send connection request' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const connectionId = req.params.id as string;
    const status = req.body.status;
    if (status !== ConnectionStatus.ACCEPTED && status !== ConnectionStatus.REJECTED) {
      return res.status(400).json({ success: false, message: 'Status must be ACCEPTED or REJECTED' });
    }
    const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection || connection.receiverId !== userId) {
      return res.status(404).json({ success: false, message: 'Incoming connection request not found' });
    }
    if (connection.status !== ConnectionStatus.PENDING) {
      return res.status(409).json({ success: false, message: 'This request has already been handled' });
    }
    const updated = await prisma.connection.update({ where: { id: connectionId }, data: { status } });
    const receiver = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(connection.senderId, 'CONNECTION_RESPONSE', `${receiver?.name ?? 'A developer'} ${status.toLowerCase()} your connection request.`);
    return res.json({ success: true, data: updated, message: `Connection request ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Update connection error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update connection request' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = res.locals.userId as string;
    const result = await prisma.connection.deleteMany({
      where: { id: req.params.id as string, OR: [{ senderId: userId }, { receiverId: userId }] }
    });
    if (!result.count) return res.status(404).json({ success: false, message: 'Connection not found' });
    return res.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    console.error('Remove connection error:', error);
    return res.status(500).json({ success: false, message: 'Unable to remove connection' });
  }
});

export default router;
