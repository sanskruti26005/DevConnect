
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// Get all projects belonging to the logged-in user
router.get('/', authenticateUser, async (_req, res) => {
  try {
    const userId = res.locals.userId;

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: projects,
      message: 'Projects fetched successfully'
    });
  } catch (error) {
    console.error('Fetch projects error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch projects'
    });
  }
});

// Add a new project
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const {
      title,
      description,
      technologies,
      githubUrl,
      liveUrl
    } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Project title and description are required'
      });
    }

    if (
      technologies !== undefined &&
      (!Array.isArray(technologies) ||
        !technologies.every((item) => typeof item === 'string'))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Technologies must be a list of strings'
      });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        technologies: (technologies || [])
          .map((item: string) => item.trim())
          .filter(Boolean),
        githubUrl: typeof githubUrl === 'string' && githubUrl.trim()
          ? githubUrl.trim()
          : null,
        liveUrl: typeof liveUrl === 'string' && liveUrl.trim()
          ? liveUrl.trim()
          : null,
        ownerId: userId
      }
    });

    return res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create project'
    });
  }
});

// Delete a project
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const projectId = req.params.id as string;

    const result = await prisma.project.deleteMany({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete project'
    });
  }
});

export default router;
