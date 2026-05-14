# Flowboard

A full-stack SaaS project management tool for teams. Built with Next.js, TypeScript, PostgreSQL, Prisma, and Socket.io.

## Live Demo
[flowboard-smoky-seven.vercel.app](https://flowboard-smoky-seven.vercel.app)

## Features
- JWT Authentication with role-based access (Admin and Member)
- Create and manage projects
- Kanban board with tasks (To Do, In Progress, Done)
- Real-time task updates with Socket.io
- Invite team members to projects
- Dashboard with analytics and charts
- Assign tasks with priority levels
- Comments on tasks
- Fully responsive UI

## Tech Stack
- **Frontend** — Next.js 15, TypeScript, Tailwind CSS, Recharts
- **Backend** — Next.js API Routes, Node.js
- **Database** — PostgreSQL (Supabase)
- **ORM** — Prisma
- **Auth** — JWT, bcryptjs
- **Real-time** — Socket.io
- **Deployment** — Vercel

## Getting Started

### Prerequisites
- Node.js v20.19+
- PostgreSQL database (Supabase)

### Installation

1. Clone the repository
```bash
git clone git@github.com:Thryyve/flowboard.git
cd flowboard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables — create a `.env` file in the root:
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-jwt-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

4. Push the database schema
```bash
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure
flowboard/
├── app/
│   ├── api/          # Backend API routes
│   ├── (dashboard)/  # Protected dashboard pages
│   ├── login/        # Login page
│   └── register/     # Register page
├── components/       # Reusable UI components
├── context/          # React Context (Auth)
├── hooks/            # Custom hooks (Socket.io)
├── lib/              # Prisma client, auth middleware
├── prisma/           # Database schema
└── types/            # TypeScript types

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and get JWT token |
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create a project |
| GET | /api/projects/:id | Get a single project |
| PATCH | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project |
| POST | /api/projects/:id/members | Add a member |
| GET | /api/projects/:id/tasks | Get all tasks |
| POST | /api/projects/:id/tasks | Create a task |
| PATCH | /api/projects/:id/tasks/:taskId | Update a task |
| DELETE | /api/projects/:id/tasks/:taskId | Delete a task |
| GET | /api/projects/:id/tasks/:taskId/comments | Get comments |
| POST | /api/projects/:id/tasks/:taskId/comments | Add a comment |
| GET | /api/stats | Get dashboard stats |