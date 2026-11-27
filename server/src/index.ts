
import authRoutes from './routes/auth.routes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import profileRoutes from './routes/profile.routes.js';
import projectRoutes from './routes/project.routes.js';
import usersRoutes from './routes/users.routes.js';
import connectionRoutes from './routes/connection.routes.js';
import blogRoutes from './routes/blog.routes.js';
import endorsementRoutes from './routes/endorsement.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import feedRoutes from './routes/feed.routes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feed', feedRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok'
    },
    message: 'DevConnect API is running'
  });
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`DevConnect server running on http://localhost:${PORT}`);
});
