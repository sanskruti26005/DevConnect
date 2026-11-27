
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// Get all feed posts
router.get('/', async (_req, res) => {
  try {
    const posts = await prisma.feedPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: posts,
      message: 'Feed posts fetched successfully'
    });
  } catch (error) {
    console.error('Fetch feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch feed posts'
    });
  }
});

// Create a feed post
router.post('/', authenticateUser, async (req, res) => {
  try {
    const content = typeof req.body.content === 'string'
      ? req.body.content.trim()
      : '';

    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Post content cannot be empty'
      });
      return;
    }

    if (content.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Post cannot exceed 1000 characters'
      });
      return;
    }

    const post = await prisma.feedPost.create({
      data: {
        content,
        authorId: res.locals.userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Create feed post error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create post'
    });
  }
});

// Delete your own feed post
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const post = await prisma.feedPost.findUnique({
     where: { id: String(req.params.id) }
    });

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found'
      });
      return;
    }

    if (post.authorId !== res.locals.userId) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
      return;
    }

    await prisma.feedPost.delete({
      where: { id: post.id }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete feed post error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to delete post'
    });
  }
});

export default router;
