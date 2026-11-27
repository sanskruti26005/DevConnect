import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateUser, async (_req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      include: { author: { select: { id: true, name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ success: true, data: posts, message: 'Blog posts fetched successfully' });
  } catch (error) {
    console.error('Fetch blog posts error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch blog posts' });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const authorId = res.locals.userId as string;
    const { title, content } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    const post = await prisma.blogPost.create({
      data: { title: title.trim(), content: content.trim(), authorId },
      include: { author: { select: { id: true, name: true, location: true } } }
    });
    return res.status(201).json({ success: true, data: post, message: 'Blog post published' });
  } catch (error) {
    console.error('Create blog post error:', error);
    return res.status(500).json({ success: false, message: 'Unable to publish blog post' });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const authorId = res.locals.userId as string;
    const { title, content } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    const result = await prisma.blogPost.updateMany({
      where: { id: req.params.id as string, authorId },
      data: { title: title.trim(), content: content.trim() }
    });
    if (!result.count) return res.status(404).json({ success: false, message: 'Blog post not found' });
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id as string },
      include: { author: { select: { id: true, name: true, location: true } } }
    });
    return res.json({ success: true, data: post, message: 'Blog post updated' });
  } catch (error) {
    console.error('Update blog post error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update blog post' });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const authorId = res.locals.userId as string;
    const result = await prisma.blogPost.deleteMany({ where: { id: req.params.id as string, authorId } });
    if (!result.count) return res.status(404).json({ success: false, message: 'Blog post not found' });
    return res.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete blog post' });
  }
});

export default router;
