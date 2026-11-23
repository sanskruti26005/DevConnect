
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// Get the logged-in user's profile
router.get(
  '/',
  authenticateUser,
  async (_req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          location: true,
          profileImage: true,
          skills: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Profile fetched successfully'
      });
    } catch (error) {
      console.error('Get profile error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }
);

// Update the logged-in user's profile
router.put(
  '/',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;

      const { name, bio, location, profileImage, skills } = req.body;

      const updateData: {
        name?: string;
        bio?: string | null;
        location?: string | null;
        profileImage?: string | null;
        skills?: string[];
      } = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Name must be a non-empty string'
          });
        }

        updateData.name = name.trim();
      }

      for (const field of ['bio', 'location', 'profileImage'] as const) {
        const value = req.body[field];

        if (value !== undefined) {
          if (value !== null && typeof value !== 'string') {
            return res.status(400).json({
              success: false,
              message: `${field} must be a string or null`
            });
          }

          updateData[field] = value;
        }
      }

      if (skills !== undefined) {
        if (
          !Array.isArray(skills) ||
          !skills.every((skill: unknown) => typeof skill === 'string')
        ) {
          return res.status(400).json({
            success: false,
            message: 'Skills must be an array of strings'
          });
        }

        updateData.skills = skills.map((skill: string) => skill.trim());
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one field to update'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          location: true,
          profileImage: true,
          skills: true,
          createdAt: true
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

export default router;
