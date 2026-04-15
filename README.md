# TeamTask - Task Management System

> A modern task management application with Kanban board, built with React + TypeScript and Node.js + PostgreSQL.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Kanban Board** - Drag-and-drop tasks between columns (To Do, In Progress, Done)
- **Project Management** - Create, edit, and delete projects
- **Task Management** - Full CRUD operations with priority, deadline, and assignee
- **Team Members** - Assign tasks to team members with avatar display
- **Dark/Light Mode** - Toggle between themes
- **Search** - Filter tasks by title or description
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

### Frontend
- React 19
- TypeScript
- TailwindCSS 4
- @hello-pangea/dnd (Drag and Drop)
- Motion (Animations)
- Lucide React (Icons)

### Backend
- Node.js
- Express.js
- PostgreSQL
- Swagger (API Documentation)

## Project Structure

```
SourceCode/
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── lib/              # Utilities
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── app.js            # Express application
│   │   ├── config/
│   │   │   └── db.js        # PostgreSQL connection
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   └── docs/             # Swagger configuration
│   ├── .env                  # Environment variables
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   ├── schema/               # Database schema
│   │   ├── 01_project.sql
│   │   ├── 02_member.sql
│   │   └── 03_task.sql
│   ├── seed/                 # Sample data
│   │   └── seed_data.sql
│   └── init.sql             # Initialize database
│
├── docker-compose.yml         # Docker configuration
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for database)
- PostgreSQL (if not using Docker)

### Option 1: Using Docker (Recommended)

```bash
# Build once after changing Dockerfiles or docker-compose.yml
docker compose up --build

# Later runs can use
docker compose up

# If an old frontend image is still serving outdated code, rebuild cleanly
docker compose down
docker compose up --build
```

### Option 2: Local Development

**1. Start PostgreSQL**

```bash
# Using Docker
docker run -d \
  --name task_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=380906 \
  -e POSTGRES_DB=app_db \
  -p 5432:5432 \
  postgres:15

# Initialize database
docker exec -i task_db psql -U postgres -d app_db < database/init.sql
```

**2. Start Backend**

```bash
cd backend
npm install
npm run dev
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/api-docs
```

**3. Start Frontend**

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

## Environment Variables

### Backend (backend/.env)

```env
PORT=8000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=380906
DB_NAME=app_db
DB_PORT=5432
```

### Frontend (optional frontend/.env)

```env
VITE_API_URL=http://localhost:8000
VITE_API_PROXY_TARGET=http://localhost:8000
```

## API Documentation

API documentation is available via Swagger UI when the backend is running:

```
http://localhost:8000/api-docs
```

### Endpoints Overview

#### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects |
| GET | /api/projects/:id | Get project by ID |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

#### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks?projectId=xxx | Get tasks (filter by project) |
| GET | /api/tasks/:id | Get task by ID |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Update task status |
| DELETE | /api/tasks/:id | Delete task |

#### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/members | Get all members |
| GET | /api/members/:id | Get member by ID |
| POST | /api/members | Create member |
| PUT | /api/members/:id | Update member |
| DELETE | /api/members/:id | Delete member |

### Request/Response Examples

#### Create Task

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid-here",
    "title": "Design System Update",
    "description": "Update the primary color palette",
    "status": "todo",
    "priority": "high",
    "assigneeId": "uuid-here",
    "deadline": "2026-04-15"
  }'
```

**Response:**

```json
{
  "id": "uuid-here",
  "projectId": "uuid-here",
  "title": "Design System Update",
  "description": "Update the primary color palette",
  "status": "todo",
  "priority": "high",
  "assigneeId": "uuid-here",
  "deadline": "2026-04-15",
  "createdAt": 1743465600000
}
```

## Database Schema

### Projects

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| icon | VARCHAR(50) | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Members

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| avatar | TEXT | |
| color | VARCHAR(20) | |

### Tasks

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| project_id | UUID | REFERENCES projects(id) |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| status | VARCHAR(20) | CHECK (todo/in-progress/done) |
| priority | VARCHAR(10) | CHECK (low/medium/high) |
| assignee_id | UUID | REFERENCES members(id) |
| deadline | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |

## Available Scripts

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # TypeScript type checking
```

### Backend

```bash
npm run dev      # Start with nodemon (auto-reload)
```

## Development

### Adding New Features

1. **Database**: Add schema in `database/schema/`
2. **Backend**: Add service, controller, route
3. **Frontend**: Add API service, update components

### Testing API

```bash
# Test database connection
curl http://localhost:8000/test-db

# Should return current timestamp
```

## Roadmap

- [ ] User authentication & authorization
- [ ] Real-time updates (WebSocket)
- [ ] Task comments & attachments
- [ ] Activity log
- [ ] Email notifications
- [ ] Export/Import tasks

## License

This project is licensed under the MIT License.

## Author

TeamTask Development Team
