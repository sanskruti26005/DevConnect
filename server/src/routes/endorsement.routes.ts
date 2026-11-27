import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../lib/notifications.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/:userId', async (req, res) => {
  try {
    const endorsements = await prisma.endorsement.findMany({
      where: { toUserId: req.params.userId as string },
      include: { fromUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: endorsements, message: 'Endorsements fetched successfully' });
  } catch (error) {
    console.error('Fetch endorsements error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch endorsements' });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const fromUserId = res.locals.userId as string;
    const toUserId = req.params.userId as string;
    const skill = typeof req.body.skill === 'string' ? req.body.skill.trim() : '';
    if (!skill) return res.status(400).json({ success: false, message: 'Select a skill to endorse' });
    if (fromUserId === toUserId) return res.status(400).json({ success: false, message: 'You cannot endorse yourself' });

    const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, name: true, skills: true } });
    if (!target) return res.status(404).json({ success: false, message: 'Developer not found' });
    const matchingSkill = target.skills.find((item) => item.toLowerCase() === skill.toLowerCase());
    if (!matchingSkill) return res.status(400).json({ success: false, message: 'That skill is not listed on the developer profile' });

    const endorsement = await prisma.endorsement.create({
      data: { fromUserId, toUserId, skill: matchingSkill }
    });
    const sender = await prisma.user.findUnique({ where: { id: fromUserId }, select: { name: true } });
    await createNotification(toUserId, 'ENDORSEMENT', `${sender?.name ?? 'A developer'} endorsed your ${matchingSkill} skill.`);
    return res.status(201).json({ success: true, data: endorsement, message: 'Skill endorsed successfully' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'You have already endorsed this skill' });
    }
    console.error('Create endorsement error:', error);
    return res.status(500).json({ success: false, message: 'Unable to endorse skill' });
  }
});

export default router;
