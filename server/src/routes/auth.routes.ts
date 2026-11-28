
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Store token in an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    console.dir(error, { depth: 5 });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get currently authenticated user
router.get('/me', authenticateUser, async (_req, res) => {
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
        skills: true
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
      message: 'User details fetched successfully'
    });

  } catch (error) {
    console.error('Fetch user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
