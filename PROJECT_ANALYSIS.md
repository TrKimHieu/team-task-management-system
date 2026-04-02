# Task Management System - Project Analysis

**Date:** 2026-04-01  
**System:** Task Management (TeamTask)  
**Architecture:** React + TypeScript (Frontend) | Node.js/Express (Backend) | PostgreSQL (Database)

---

## 1. System Overview

### Current State
- **Frontend:** ✅ React + TypeScript với Kanban board, drag-and-drop
- **Backend:** ⚠️ Structure có sẵn, nhưng **CHƯA implement logic**
- **Database:** ✅ PostgreSQL schema hoàn chỉnh

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, TailwindCSS, @hello-pangea/dnd |
| Backend | Express.js, pg (PostgreSQL driver), Swagger |
| Database | PostgreSQL |
| Dev Tools | Vite, nodemon, Docker |

---

## 2. Entities & Relationships

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PROJECT      │       │     TASK        │       │     MEMBER      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │       │ id (PK)         │
│ name            │  │    │ project_id (FK) │←──────│ name            │
│ icon            │  │    │ title           │       │ avatar          │
└─────────────────┘  │    │ description     │       │ color           │
                     │    │ status          │       └─────────────────┘
                     │    │ priority        │
                     │    │ assignee_id(FK) │←───────────────────────
                     │    │ deadline        │
                     │    │ created_at      │
                     │    └─────────────────┘
                     │
                     └─────────────────────────────────────────────
```

### Relationships
- **Project → Task:** One-to-Many (1 project contains N tasks)
- **Member → Task:** One-to-Many (1 member can be assigned to N tasks)
- **Task → Project:** Many-to-One (N tasks belong to 1 project)
- **Task → Member:** Many-to-One (N tasks assigned to 1 member)

---

## 3. Field Mapping: Frontend ↔ Database

### 3.1 PROJECT Entity

| Frontend (TypeScript) | Database (PostgreSQL) | Notes |
|----------------------|----------------------|-------|
| `id: string` | `id UUID PRIMARY KEY` | Auto-generated UUID |
| `name: string` | `name VARCHAR(255) NOT NULL` | Required |
| `icon: string` | `icon VARCHAR(50)` | Emoji (optional) |

**Mapping:** Direct 1:1 mapping ✅

---

### 3.2 MEMBER Entity

| Frontend (TypeScript) | Database (PostgreSQL) | Notes |
|----------------------|----------------------|-------|
| `id: string` | `id UUID PRIMARY KEY` | Auto-generated UUID |
| `name: string` | `name VARCHAR(255) NOT NULL` | Required |
| `avatar: string` | `avatar TEXT` | Avatar URL/initials |
| `color: string` | `color VARCHAR(20)` | CSS color class |

**Mapping:** Direct 1:1 mapping ✅

---

### 3.3 TASK Entity

| Frontend (TypeScript) | Database (PostgreSQL) | Notes |
|----------------------|----------------------|-------|
| `id: string` | `id UUID PRIMARY KEY` | Auto-generated UUID |
| `projectId: string` | `project_id UUID REFERENCES projects(id)` | Foreign Key |
| `title: string` | `title VARCHAR(255) NOT NULL` | Required |
| `description: string` | `description TEXT` | Optional |
| `status: Status` | `status VARCHAR(20) CHECK (...)` | `todo` \| `in-progress` \| `done` |
| `priority` | `priority VARCHAR(10) CHECK (...)` | `low` \| `medium` \| `high` |
| `assigneeId?: string` | `assignee_id UUID REFERENCES members(id)` | Optional FK |
| `deadline?: string` | `deadline TIMESTAMP` | Optional |
| `createdAt: number` | `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | ⚠️ Type mismatch |

### ⚠️ CRITICAL ISSUES:

1. **Field Naming Convention:**
   - Frontend: camelCase (`projectId`, `assigneeId`)
   - Database: snake_case (`project_id`, `assignee_id`)
   - **Need transformation layer!**

2. **CreatedAt Type Mismatch:**
   - Frontend: `number` (Unix timestamp: `Date.now()`)
   - Database: `TIMESTAMP` (ISO 8601 date string)
   - **Need conversion: `Date.now()` ↔ `toISOString()`**

3. **Priority in Frontend:**
   - Frontend: `priority: 'low' | 'medium' | 'high'` ✅
   - Database: Same values ✅
   - **Match!**

---

## 4. Required API Endpoints

### 4.1 Project Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/projects` | Get all projects | - | `Project[]` |
| GET | `/api/projects/:id` | Get project by ID | - | `Project` |
| POST | `/api/projects` | Create new project | `{ name, icon? }` | `Project` |
| PUT | `/api/projects/:id` | Update project | `{ name?, icon? }` | `Project` |
| DELETE | `/api/projects/:id` | Delete project | - | `{ success: true }` |

---

### 4.2 Member Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/members` | Get all members | - | `Member[]` |
| GET | `/api/members/:id` | Get member by ID | - | `Member` |
| POST | `/api/members` | Create new member | `{ name, avatar?, color? }` | `Member` |
| PUT | `/api/members/:id` | Update member | `{ name?, avatar?, color? }` | `Member` |
| DELETE | `/api/members/:id` | Delete member | - | `{ success: true }` |

---

### 4.3 Task Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/tasks` | Get all tasks | Query: `?projectId=xxx` | `Task[]` |
| GET | `/api/tasks/:id` | Get task by ID | - | `Task` |
| POST | `/api/tasks` | Create new task | `{ projectId, title, description?, status?, priority?, assigneeId?, deadline? }` | `Task` |
| PUT | `/api/tasks/:id` | Update task | `{ title?, description?, status?, priority?, assigneeId?, deadline? }` | `Task` |
| PATCH | `/api/tasks/:id/status` | Update task status only | `{ status }` | `Task` |
| DELETE | `/api/tasks/:id` | Delete task | - | `{ success: true }` |

---

### 4.4 Query Examples

```sql
-- Get all tasks for a project with assignee details
SELECT t.*, m.name as assignee_name, m.avatar as assignee_avatar, m.color as assignee_color
FROM tasks t
LEFT JOIN members m ON t.assignee_id = m.id
WHERE t.project_id = $1
ORDER BY t.created_at DESC;

-- Get tasks grouped by status (Kanban view)
SELECT * FROM tasks 
WHERE project_id = $1 
ORDER BY 
  CASE status 
    WHEN 'todo' THEN 1 
    WHEN 'in-progress' THEN 2 
    WHEN 'done' THEN 3 
  END,
  CASE priority 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END;
```

---

## 5. Business Logic Summary

### 5.1 Core Features

#### ✅ Implemented in Frontend
1. **Project Management**
   - Create project (name + icon)
   - Delete project (with cascade delete of tasks)
   - Switch between projects
   - Persist to localStorage

2. **Task Management**
   - Create task with full details
   - Edit task (modal form)
   - Delete task
   - Drag-and-drop to change status
   - Filter tasks by search query
   - Persist to localStorage

3. **Member/Assignee**
   - Assign member to task
   - Display assignee avatar on task card
   - Pre-defined team members list (hardcoded)

4. **UI Features**
   - Light/Dark theme toggle
   - Responsive sidebar
   - Kanban board (3 columns)
   - Priority badges
   - Deadline display
   - Creation date display

#### ❌ Not Yet Implemented (Backend)
- User authentication/authorization
- Real API integration (currently using localStorage)
- Data validation
- Error handling
- Real-time updates (WebSocket)

---

### 5.2 Business Rules & Constraints

#### Task Status Flow
```
[CREATED] → [todo] → [in-progress] → [done]
                ↑                      ↓
                ←──────────────────────
```

- Tasks can only have one status at a time
- Status can be changed via drag-and-drop
- No automatic status transitions

#### Priority Levels
```
high > medium > low
```

#### Field Constraints

| Field | Constraints |
|-------|------------|
| `project.name` | Required, max 255 chars |
| `task.title` | Required, max 255 chars |
| `task.description` | Optional |
| `task.status` | Enum: `todo`, `in-progress`, `done` |
| `task.priority` | Enum: `low`, `medium`, `high` |
| `task.deadline` | Optional, timestamp |
| `task.assignee_id` | Optional, FK to members |

#### Deletion Rules
- **Project:** CASCADE delete all related tasks
- **Member:** SET NULL on task.assignee_id (or CASCADE based on requirement)
- **Task:** No special rules

---

## 6. Potential Problems & Improvements

### 6.1 CRITICAL Issues

#### ❌ Backend Not Implemented
**Problem:** Backend has folder structure but NO logic in routes/controllers/services
```javascript
// backend/src/routes/task.routes.js - EMPTY FILE
// backend/src/controllers/task.controller.js - EMPTY FILE
// backend/src/services/task.service.js - EMPTY FILE
```

**Impact:** Frontend cannot connect to database, app only works with localStorage

**Solution:** Implement full CRUD operations for all entities

---

#### ❌ Frontend ↔ Database Field Naming Mismatch
**Problem:** 
```typescript
// Frontend uses camelCase
Task {
  projectId: string;      // ❌
  assigneeId: string;     // ❌
  createdAt: number;       // ❌
}

// Database uses snake_case
tasks {
  project_id: UUID;       // ❌
  assignee_id: UUID;     // ❌
  created_at: TIMESTAMP;  // ❌
}
```

**Impact:** API requests will fail or have incorrect field names

**Solution:** Create transformation layer in service/backend:
```javascript
// Example transformation
const transformTaskFromDB = (dbTask) => ({
  id: dbTask.id,
  projectId: dbTask.project_id,
  title: dbTask.title,
  assigneeId: dbTask.assignee_id,
  createdAt: new Date(dbTask.created_at).getTime(), // Convert to timestamp
  // ... other fields
});
```

---

### 6.2 HIGH Priority Issues

#### ⚠️ No API Service Layer in Frontend
**Problem:** Frontend uses localStorage, no API calls to backend

**Current Code:**
```typescript
// frontend/src/App.tsx
const [tasks, setTasks] = useState<Task[]>(() => {
  const saved = localStorage.getItem('notion_tasks');
  return saved ? JSON.parse(saved) : INITIAL_TASKS;
});
```

**Solution:** Create API service module:
```typescript
// frontend/src/services/api.ts
const API_BASE = 'http://localhost:3000/api';

export const taskAPI = {
  getAll: (projectId: string) => fetch(`${API_BASE}/tasks?projectId=${projectId}`),
  create: (task: Partial<Task>) => fetch(`${API_BASE}/tasks`, { method: 'POST', body: JSON.stringify(task) }),
  // ... etc
};
```

---

#### ⚠️ Missing Input Validation
**Problem:** No validation on user inputs

**Current Code:**
```typescript
// No validation
if (!title) return; // Only checks for empty string
```

**Solution:** Add validation library (e.g., Zod, Joi)

---

#### ⚠️ No Error Handling
**Problem:** API errors not handled gracefully

**Solution:** Add try-catch blocks and user-friendly error messages

---

### 6.3 MEDIUM Priority Issues

#### 📝 Inconsistent Member Data
**Problem:** Frontend has hardcoded members, database has different members

```typescript
// Frontend
const TEAM_MEMBERS = [
  { id: 'm1', name: 'Quynh Truong', avatar: 'QT', color: 'bg-blue-500' },
  { id: 'm2', name: 'Alex Johnson', avatar: 'AJ', color: 'bg-emerald-500' },
];

// Database
INSERT INTO members VALUES
  ('Hieu', 'avatar1.png', 'blue'),
  ('An', 'avatar2.png', 'red');
```

**Impact:** ID mismatch, data inconsistency

**Solution:** Remove hardcoded members, fetch from API

---

#### 📝 Missing `updated_at` Field
**Problem:** No tracking of last modification time

**Solution:** Add `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` to tasks table

---

#### 📝 No Soft Delete
**Problem:** Tasks are permanently deleted

**Solution:** Add `deleted_at TIMESTAMP` for soft delete functionality

---

### 6.4 LOW Priority Improvements

1. **Add Pagination** - For projects with many tasks
2. **Add Task Ordering** - Drag-and-drop within same status column
3. **Add Task Tags/Labels** - Many-to-many relationship
4. **Add Comments** - Task discussion feature
5. **Add Attachments** - File uploads
6. **Add Activity Log** - Track changes
7. **Add Search** - Full-text search on task title/description

---

## 7. Implementation Roadmap

### Phase 1: Backend Foundation (Priority: CRITICAL)
1. ✅ Database schema ready
2. ⬜ Implement CRUD for Projects
3. ⬜ Implement CRUD for Members
4. ⬜ Implement CRUD for Tasks
5. ⬜ Add validation and error handling
6. ⬜ Write API documentation (Swagger)

### Phase 2: Frontend Integration (Priority: HIGH)
1. ⬜ Create API service layer
2. ⬜ Replace localStorage with API calls
3. ⬜ Add loading states
4. ⬜ Add error handling and retry logic
5. ⬜ Remove hardcoded TEAM_MEMBERS

### Phase 3: Enhanced Features (Priority: MEDIUM)
1. ⬜ User authentication
2. ⬜ Real-time updates (WebSocket)
3. ⬜ Task comments
4. ⬜ File attachments
5. ⬜ Activity log

---

## 8. Testing Checklist

### Backend Tests
- [ ] Project CRUD operations
- [ ] Member CRUD operations
- [ ] Task CRUD operations
- [ ] Foreign key constraints
- [ ] Input validation
- [ ] Error responses

### Frontend Tests
- [ ] API integration
- [ ] Drag-and-drop functionality
- [ ] Theme switching
- [ ] Search filtering
- [ ] Modal forms
- [ ] Responsive design

### Integration Tests
- [ ] End-to-end task creation flow
- [ ] Project deletion (cascade)
- [ ] Member reassignment
- [ ] Status transitions

---

## 9. File Structure

```
SourceCode/
├── frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── App.tsx          # Main component
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── lib/             # Utilities
│   │   └── main.tsx         # Entry point
│   └── package.json
│
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── app.js           # Main app (only has basic setup)
│   │   ├── routes/          # ⚠️ EMPTY - need implementation
│   │   ├── controllers/     # ⚠️ EMPTY - need implementation
│   │   ├── services/        # ⚠️ EMPTY - need implementation
│   │   ├── config/          # Database config
│   │   └── docs/            # Swagger docs
│   └── package.json
│
├── database/
│   ├── schema/
│   │   ├── 01_project.sql
│   │   ├── 02_member.sql
│   │   └── 03_task.sql
│   ├── seed/
│   │   └── seed_data.sql
│   └── init.sql
│
├── docker-compose.yml        # Docker setup
└── README.md
```

---

## 10. Quick Reference

### Database Connection
```javascript
// backend/src/config/db.js
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskmanager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
```

### Frontend TypeScript Interfaces
```typescript
// frontend/src/types.ts
export type Status = 'todo' | 'in-progress' | 'done';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  deadline?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
}
```

### Key Frontend Components
- **Kanban Board:** Drag-and-drop with 3 columns (To Do, In Progress, Done)
- **Task Card:** Shows title, description, priority, deadline, assignee
- **Modals:** Create/Edit Task, Create Project
- **Sidebar:** Project list, theme toggle, settings

---

## Summary

**Current Status:** 
- Frontend: 90% complete (localStorage-based)
- Backend: 10% complete (structure only)
- Database: 100% complete

**Next Step:** Implement backend CRUD operations and connect frontend to API

**Major Challenge:** Field naming convention mismatch (camelCase ↔ snake_case) and missing API integration layer
