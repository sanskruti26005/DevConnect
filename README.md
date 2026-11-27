# DevConnect

A full-stack developer networking and portfolio platform built with React, TypeScript, Express, Prisma and Neon PostgreSQL.

## Included features

- Account registration, login, logout and cookie-based JWT authentication
- Developer profile display and editing
- Create, list and delete personal projects
- Search public developer profiles by name, location or skill
- Send, accept, reject and remove connection requests
- Publish, edit, list and delete developer blog posts
- Endorse another developer's listed skills (one endorsement per person and skill)
- In-app notifications for connection requests, connection responses and endorsements
- Accordion dashboard with one section open at a time

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database (Neon is supported)

## 1. Install dependencies

From the project root:

```powershell
npm.cmd install
```

## 2. Configure environment variables

Copy `server/.env.example` to `server/.env` and fill in your own values:

- `DATABASE_URL`: Neon pooled connection string used by the application
- `DIRECT_URL`: Neon direct/non-pooled connection string used by Prisma migrations
- `JWT_SECRET`: a long random secret, at least 32 characters
- `CLIENT_URL`: normally `http://localhost:5173`
- `PORT`: normally `5000`

Do not commit `server/.env` or share it publicly.

## 3. Generate Prisma Client

After installing dependencies and setting up the environment:

```powershell
npm.cmd run db:generate
```

This regenerates the Prisma client from `server/prisma/schema.prisma`. Do this whenever the schema changes.

## 4. Apply database migrations

For local development:

```powershell
npm.cmd run db:migrate
```

This applies the existing initial migration and the social-features migration that adds endorsements and notifications. Use the direct database URL in `DIRECT_URL`.

For a deployment environment where migrations have already been reviewed:

```powershell
npm.cmd run db:deploy
```

## 5. Start the application

Open two terminals at the project root.

Terminal 1 — backend:

```powershell
npm.cmd run dev:server
```

Terminal 2 — frontend:

```powershell
npm.cmd run dev
```

Open `http://localhost:5173`.

## 6. Build checks

After Prisma Client generation:

```powershell
npm.cmd run build
```

## API overview

All protected routes use the HTTP-only `token` cookie.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET/POST | `/api/auth/me`, `/api/auth/login`, `/api/auth/register` | Authentication |
| POST | `/api/auth/logout` | Logout |
| GET/PUT | `/api/profile` | Current profile |
| GET/POST/DELETE | `/api/projects` | Current user's projects |
| GET | `/api/users?search=` | Search developers |
| GET/POST | `/api/connections` | List connections / send request (`POST /:userId`) |
| PATCH/DELETE | `/api/connections/:id` | Respond to or remove a connection |
| GET/POST | `/api/blogs` | List or publish posts |
| PUT/DELETE | `/api/blogs/:id` | Edit or delete own post |
| GET/POST | `/api/endorsements/:userId` | List endorsements / endorse a listed skill |
| GET | `/api/notifications` | List current user's notifications |
| PATCH | `/api/notifications/read-all` | Mark all notifications read |
| PATCH | `/api/notifications/:id/read` | Mark one notification read |

## Important notes

- This is an MVP implementation. Notifications are stored in the database and displayed when the dashboard loads or refreshes; they are not real-time push notifications.
- Search currently returns up to 40 developers and supports name, location and exact skill matching.
- Profile image storage, OAuth, chat, comments, likes, email delivery and deployment configuration are not included in this package.
- Before public deployment, configure HTTPS, production cookie settings, rate limiting, stricter request validation, logging and a production database backup strategy.
