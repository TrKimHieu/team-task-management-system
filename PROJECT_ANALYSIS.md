# Project Analysis Report: TeamTask - Task Management System

## 1. System Overview

### 1.1 Purpose

TeamTask is a modern, role-based task management application featuring a Kanban board interface. The system enables teams to manage projects, organize tasks across customizable columns, assign team members to tasks, and track task progress through visual drag-and-drop interactions.

### 1.2 Main Features

- **Kanban Board**: Drag-and-drop task management across three columns (To Do, In Progress, Done)
- **Project Management**: Create, edit, and delete projects with associated boards
- **Task Management**: Full CRUD operations with priority levels, deadlines, and assignees
- **Role-Based Access Control (RBAC)**: Three-tier permission system (Member, Leader, Admin)
- **User Authentication**: JWT-based authentication with registration and login
- **Dark/Light Theme**: User-selectable interface theme
- **Search Functionality**: Filter tasks by title or description
- **Responsive Design**: Works across desktop and mobile devices

### 1.3 Key Actors

| Actor | Role | Permissions |
|-------|------|-------------|
| Admin | `admin` | Full system access, manage all projects and users |
| Leader | `leader` | Create projects, manage tasks within projects |
| Member | `member` | View projects, update status of assigned tasks |

---

## 2. Architecture Analysis

### 2.1 Architectural Style

The system follows a **Three-Tier Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                 (React + TypeScript + TailwindCSS)               │
│   TeamTaskApp.tsx, Components, Services (api.ts, authService)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│                     (Node.js + Express.js)                      │
│     Controllers: task.controller.js, project.controller.js     │
│     Services: task.service.js, project.service.js               │
│     Middleware: auth.middleware.js                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│                   (PostgreSQL + pg Pool)                        │
│    Database Schema: init_v2.sql                                 │
│    Connection Pool: config/db.js                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Justification

**Folder Structure Evidence:**
- `frontend/`: Contains React application with UI components and API services
- `backend/src/`: Contains Express application with distinct directories for controllers, services, routes, middleware, and config
- `database/`: Contains SQL schema files and migrations

The separation demonstrates a proper layered architecture where:
- **Presentation** is decoupled from **Business Logic** (communicates via HTTP/REST API)
- **Business Logic** is decoupled from **Data Access** (services use connection pool abstraction)
- Each layer can be modified independently without affecting others

### 2.3 Component Interaction Flow

```
┌──────────────┐     HTTP/REST      ┌──────────────┐     SQL Query     ┌──────────────┐
│   Browser    │ ─────────────────► │   Express    │ ────────────────► │  PostgreSQL  │
│  (React UI)  │ ◄───────────────── │   Server     │ ◄──────────────── │  Database    │
└──────────────┘    JSON Response   └──────────────┘   Query Results   └──────────────┘
```

1. **Frontend** sends HTTP requests (GET/POST/PUT/PATCH/DELETE) with JWT token in Authorization header
2. **Express middleware** (CORS, JSON parser, auth.middleware) processes the request
3. **Routes** direct requests to appropriate **Controllers**
4. **Controllers** call **Services** for business logic
5. **Services** interact with the database via **pg Pool**
6. Responses flow back through the same path in reverse

---

## 3. Layered Design

### 3.1 Presentation Layer

**Responsibilities:**
- Render user interface components
- Handle user interactions and state management
- Communicate with backend via HTTP API
- Manage local storage for tokens and theme preferences

**Main Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Main App | `TeamTaskApp.tsx` | Root component containing all UI and state management |
| API Client | `services/api.ts` | Axios instance with interceptors for auth tokens |
| Auth Service | `services/authService.ts` | Authentication API calls |
| Task Service | `services/taskService.ts` | Task CRUD API calls |
| Project Service | `services/projectService.ts` | Project API calls |
| Types | `types.ts` | TypeScript interfaces for all data structures |

**Key UI Components in TeamTaskApp.tsx:**
- `TaskCard`: Individual task display with drag-drop support
- `Modal`: Reusable modal container for forms
- Kanban columns: Three droppable areas for task status

**Layer Interaction:**
- Calls backend REST API endpoints via services
- Uses React hooks (useState, useEffect, useMemo) for state management
- Stores JWT token in localStorage via `setAuthToken()`
- Handles 401 responses via interceptor to logout user

### 3.2 Business Logic Layer

**Responsibilities:**
- Handle HTTP request/response logic (Controllers)
- Implement business rules and validation (Services)
- Authenticate users and authorize actions (Middleware)

**Main Components:**

| Component Type | Directory | Examples |
|----------------|-----------|----------|
| Controllers | `src/controllers/` | `task.controller.js`, `project.controller.js`, `auth.controller.js` |
| Services | `src/services/` | `task.service.js`, `project.service.js`, `auth.service.js` |
| Middleware | `src/middleware/` | `auth.middleware.js` |
| Constants | `src/constants.js` | Role definitions, status values |

**Controller Responsibilities:**
- Extract request parameters and body
- Validate input data
- Call appropriate service methods
- Return HTTP responses with status codes

**Service Responsibilities:**
- Execute database queries
- Implement business logic (task creation, status updates, permission checks)
- Handle transactions for multi-table operations
- Transform database rows to API response format

**Middleware Responsibilities:**
- `requireAuth`: Verify JWT token presence and validity
- `requireRole`: Check if user has required role
- `requireTaskAssignmentOrElevatedRole`: Allow members to only modify assigned tasks

**Layer Interaction:**
- Controllers delegate business logic to Services
- Services return transformed data to Controllers
- Controllers send HTTP responses to clients
- Middleware runs before Controllers to validate requests

### 3.3 Data Layer

**Responsibilities:**
- Manage database connections
- Execute SQL queries
- Handle connection pooling and retries
- Run database migrations

**Main Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Database Config | `config/db.js` | PostgreSQL connection pool with retry logic |
| Schema | `database/init_v2.sql` | Complete database schema definition |
| Migrations | `config/db.js` (runMigrations) | Schema evolution (add columns) |

**Database Configuration (db.js):**
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionTimeoutMillis: 5000,
  max: 10,  // Maximum pool size
});
```

**Key Features:**
- **Connection Pooling**: Reuses database connections (max: 10)
- **Retry Logic**: Automatic reconnection on failure (10 retries, 3s delay)
- **Migration System**: Applies schema changes safely (checks for duplicate columns)
- **Transaction Support**: Services use `BEGIN/COMMIT/ROLLBACK` for atomic operations

**Layer Interaction:**
- Services import `pool` from `config/db.js`
- Services execute queries using `pool.query()` or `client.query()` for transactions
- Database returns results to Services
- Services transform results and return to Controllers

---

## 4. Module Decomposition

### 4.1 Authentication Module

**Purpose**: Handle user registration, login, logout, and session management.

**Main Files:**
| File | Responsibility |
|------|----------------|
| `auth.controller.js` | Request handling, input validation |
| `auth.service.js` | Registration logic, login with bcrypt, JWT signing |
| `auth.middleware.js` | Token verification, role checking |

**Key Operations:**
- `register`: Create new user with hashed password
- `login`: Verify credentials, return JWT token
- `me`: Get current authenticated user
- `logout`: Clear client-side token

### 4.2 User Management Module

**Purpose**: Manage user profiles and system-wide user operations.

**Main Files:**
| File | Responsibility |
|------|----------------|
| `user.controller.js` | User listing, profile updates |
| `user.service.js` | User CRUD, email normalization |

**Key Operations:**
- `list`: Get all users
- `updateMe`: Update own profile (name, avatar, color, password)
- `updateById`: Admin/Leader can update any user

### 4.3 Project Module

**Purpose**: Manage projects and their associated boards/columns.

**Main Files:**
| File | Responsibility |
|------|----------------|
| `project.controller.js` | Project CRUD endpoints |
| `project.service.js` | Project creation with board setup, permission building |

**Key Operations:**
- `create`: Creates project, board, and default columns atomically
- `getAll`: List all projects with user-specific permissions
- `update`: Modify project details
- `remove`: Delete project (cascades to boards, columns, tasks)

**Board Structure:**
- Each project has one board
- Each board has three columns: `todo`, `in-progress`, `done`

### 4.4 Task Module

**Purpose**: Manage tasks within projects, including creation, assignment, and status updates.

**Main Files:**
| File | Responsibility |
|------|----------------|
| `task.controller.js` | Task CRUD, status validation |
| `task.service.js` | Task creation, assignment management, status updates |

**Key Operations:**
- `create`: Create task with auto-positioning, assignee assignment
- `update`: Modify task details
- `updateStatus`: Change task status (updates board_column_id)
- `remove`: Delete task and its assignments
- `replaceAssignees`: Manage task-user assignments in junction table

**Key Workflow: Task Creation Flow**
```
1. Receive: { projectId, title, description, status, priority, assigneeIds }
2. Begin Transaction
3. Get column ID for status from board_columns table
4. Calculate next position for task ordering
5. INSERT into tasks table
6. INSERT into task_assignees for each assignee
7. COMMIT Transaction
8. Return created task with assignees
```

### 4.5 Task Assignment Module (Junction)

**Purpose**: Manage many-to-many relationship between tasks and users.

**Implementation:**
- `task_assignees` junction table
- `replaceAssignees()` function in task.service.js
- Handles atomic assignment updates

---

## 5. Key Workflows

### 5.1 User Authentication Workflow

**Purpose**: Authenticate user and establish session with JWT token.

**Sequence:**
```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Express │     │  Auth   │     │  User   │     │   DB    │
│(React)  │     │  Server │     │Service  │     │Service  │     │(pg Pool)│
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │ POST /auth/login              │               │               │
     │──────────►                     │               │               │
     │                               │ getByEmailWithPassword        │
     │                               │──────────────►│               │
     │                               │               │ SELECT email  │
     │                               │               │──────────────►│
     │                               │               │◄──────────────│
     │                               │◄──────────────│               │
     │                               │   bcrypt.compare(password)     │
     │                               │   (if valid)                  │
     │                               │   jwt.sign(payload, secret)    │
     │                               │──────────────►│               │
     │  { token, user }              │◄──────────────│               │
     │◄──────────────────────────────│               │               │
     │  Store token in localStorage  │               │               │
```

**Processing Steps:**
1. Client submits email/password
2. `auth.controller.js` validates required fields
3. `auth.service.js` normalizes email (lowercase, trim)
4. `user.service.js` queries user by email
5. `bcrypt.compare()` verifies password
6. `jwt.sign()` creates token with {userId, email, role, name}
7. Response includes token and user object
8. Client stores token for subsequent requests

### 5.2 Create Task Workflow

**Purpose**: Create a new task within a project with assignees.

**Sequence:**
```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Express │     │  Task   │     │  Task   │     │   DB    │
│(React)  │     │  Server │     │Controller│    │Service  │     │(pg Pool)│
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │ POST /api/tasks              │               │               │
     │ {projectId, title, status,   │               │               │
     │  priority, assigneeIds}      │               │               │
     │──────────►                   │               │               │
     │                             │ validateStatus│               │
     │                             │ validatePriority              │
     │                             │──────────────►│               │
     │                             │               │ BEGIN TX       │
     │                             │               │───────────────►│
     │                             │               │ getColumnIdFor │
     │                             │               │ Status         │
     │                             │               │───────────────►│
     │                             │               │◄───────────────│
     │                             │               │ getNextPosition│
     │                             │               │───────────────►│
     │                             │               │◄───────────────│
     │                             │               │ INSERT task     │
     │                             │               │───────────────►│
     │                             │               │◄───────────────│
     │                             │               │ INSERT assignees│
     │                             │               │───────────────►│
     │                             │               │◄───────────────│
     │                             │               │ COMMIT TX      │
     │                             │               │───────────────►│
     │  { created task }           │◄──────────────│               │
     │  201 { task with assignees }│◄───────────────────────────────│
     │◄────────────────────────────│               │               │
```

**Processing Steps:**
1. Client sends POST with task data
2. Middleware `requireAuth` verifies JWT token
3. Middleware `requireRole` checks for LEADER or ADMIN
4. Controller validates status and priority enums
5. Service begins database transaction
6. Service queries `board_columns` for column ID based on status
7. Service calculates next position within that status column
8. Service inserts task into `tasks` table
9. Service deletes existing `task_assignees` for this task (if any)
10. Service inserts new `task_assignees` records
11. Service commits transaction
12. Service retrieves complete task with assignees
13. Response returns 201 Created with task object

### 5.3 Drag-and-Drop Task Status Update Workflow

**Purpose**: Move a task between Kanban columns via drag-and-drop.

**Sequence:**
```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Express │     │  Task   │     │  Task   │     │   DB    │
│(React)  │     │  Server │     │Controller│    │Service  │     │(pg Pool)│
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │ PATCH /api/tasks/:id/status   │               │               │
     │ { status: "done" }           │               │               │
     │──────────►                   │               │               │
     │                             │ validateStatus │               │
     │                             │──────────────►│               │
     │                             │               │ getById       │
     │                             │               │──────────────►│
     │                             │               │◄──────────────│
     │                             │               │ BEGIN TX       │
     │                             │               │──────────────►│
     │                             │               │ getColumnIdFor│
     │                             │               │ new status    │
     │                             │               │──────────────►│
     │                             │               │◄──────────────│
     │                             │               │ UPDATE tasks  │
     │                             │               │ (status,     │
     │                             │               │  board_column)│
     │                             │               │──────────────►│
     │                             │               │◄──────────────│
     │                             │               │ COMMIT TX     │
     │                             │               │──────────────►│
     │  { updated task }           │◄──────────────│               │
     │◄────────────────────────────│               │               │
     │  UI updates Kanban board     │               │               │
```

**Processing Steps:**
1. User drags task card to new column
2. React DragDropContext captures `onDragEnd` event
3. Client sends PATCH request with new status
4. Middleware verifies auth token
5. Controller validates status value
6. Service retrieves current task to get projectId
7. Service begins transaction
8. Service queries new `board_column_id` for destination status
9. Service updates task with new status and board_column_id
10. Service updates `updated_at` timestamp
11. Service commits transaction
12. Response returns updated task
13. React state updates to reflect new column

---

## 6. Class-Level Design

### 6.1 Key Entities and Relationships

**Entity Relationship Diagram (Conceptual):**

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Project    │       │     Task     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ name         │  │    │ name         │  │    │ project_id(FK)
│ email        │  │    │ description  │  │    │ board_column │
│ password_hash│  │    │ icon         │  │    │ title        │
│ role         │  │    │ created_by   │  │    │ description  │
│ avatar       │  │    └──────────────┘  │    │ status       │
│ color        │  │                     │    │ priority     │
└──────────────┘  │    ┌──────────────┐  │    │ due_date     │
       │           │    │   Board      │  │    │ position     │
       │           └───►│              │◄─┘    │ completed    │
       │                ├──────────────┤       │ created_at   │
       │                │ id (PK)      │       │ updated_at   │
       │                │ project_id   │       └──────────────┘
       │                │ name         │              │
       │                └──────────────┘              │
       │                       │                     │
       │                       ▼                     │
       │                ┌──────────────┐             │
       │                │BoardColumn   │             │
       │                ├──────────────┤             │
       │                │ id (PK)      │             │
       │                │ board_id (FK)│             │
       │                │ key          │             │
       │                │ name         │             │
       │                │ position     │             │
       │                └──────────────┘             │
       │                                           │
       └──────► ┌──────────────┐ ◄──────┐
                │TaskAssignee  │        │
                ├──────────────┤        │
                │ task_id (FK) │────────┘
                │ user_id (FK) │────────┘
                │ assigned_at  │
                └──────────────┘
```

### 6.2 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Project | 1:N | A user can create multiple projects |
| User → Task | 1:N | A user can create multiple tasks |
| User ↔ Task | M:N | Through `task_assignees` junction table |
| Project → Board | 1:1 | Each project has one board |
| Board → BoardColumn | 1:N | Each board has multiple columns |
| Project → Task | 1:N | A project contains many tasks |
| Task → BoardColumn | N:1 | Tasks belong to a column |

### 6.3 Class Mapping to JavaScript Modules

**Service Classes (Backend):**

| Class | File | Responsibilities |
|-------|------|------------------|
| TaskService | `task.service.js` | Task CRUD, assignment management, position calculation |
| ProjectService | `project.service.js` | Project CRUD, board creation, permission building |
| AuthService | `auth.service.js` | Registration, login, token generation |
| UserService | `user.service.js` | User CRUD, normalization |

**Controller Classes (Backend):**

| Class | File | Responsibilities |
|-------|------|------------------|
| TaskController | `task.controller.js` | Request handling, validation, response formatting |
| ProjectController | `project.controller.js` | Request handling, validation, response formatting |
| AuthController | `auth.controller.js` | Auth request handling, input validation |
| UserController | `user.controller.js` | User request handling |

**Frontend Service Modules:**

| Module | File | Responsibilities |
|--------|------|------------------|
| api | `services/api.ts` | Axios instance, interceptors, token management |
| authService | `services/authService.ts` | Authentication API calls |
| taskService | `services/taskService.ts` | Task API calls |
| projectService | `services/projectService.ts` | Project API calls |
| userService | `services/userService.ts` | User API calls |

---

## 7. Database Design

### 7.1 Main Entities/Tables

**users**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(50) | NOT NULL | Display name |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(20) | NOT NULL, CHECK | member/leader/admin |
| avatar | VARCHAR(10) | | 2-char initials |
| color | VARCHAR(20) | NOT NULL | CSS class for avatar |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**projects**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | | Project description |
| icon | VARCHAR(50) | | Emoji icon |
| created_by | UUID | REFERENCES users | Creator FK |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**boards**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | UNIQUE, REFERENCES projects | One board per project |
| name | VARCHAR(255) | NOT NULL | Board name |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**board_columns**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| board_id | UUID | REFERENCES boards | Parent board |
| key | VARCHAR(30) | CHECK, UNIQUE with board_id | todo/in-progress/done |
| name | VARCHAR(100) | NOT NULL | Display name |
| position | INTEGER | NOT NULL, UNIQUE with board_id | Column order |

**tasks**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | REFERENCES projects | Parent project |
| board_column_id | UUID | REFERENCES board_columns | Current column |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | | Task details |
| created_by | UUID | REFERENCES users | Creator |
| status | VARCHAR(20) | CHECK | Current status |
| priority | VARCHAR(10) | CHECK | low/medium/high |
| due_date | TIMESTAMP | | Deadline |
| position | INTEGER | NOT NULL | Order within column |
| completed | BOOLEAN | DEFAULT FALSE | Completion flag |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**task_assignees** (Junction Table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| task_id | UUID | REFERENCES tasks | Task FK |
| user_id | UUID | REFERENCES users | User FK |
| assigned_at | TIMESTAMP | NOT NULL | Assignment timestamp |
| PRIMARY KEY | | (task_id, user_id) | Composite key |

**project_members**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| project_id | UUID | REFERENCES projects | Project FK |
| user_id | UUID | REFERENCES users | User FK |
| project_role | VARCHAR(20) | CHECK | Role within project |
| joined_at | TIMESTAMP | NOT NULL | Join timestamp |
| PRIMARY KEY | | (project_id, user_id) | Composite key |

### 7.2 Entity Relationships Summary

```
users ──────┬────── creates ──────► projects
            │                         │
            │                         │
            │              ┌──────────┴──────────┐
            │              │                     │
            │              ▼                     │
            │           boards                    │
            │              │                     │
            │              ▼                     │
            │       board_columns ◄──────┐       │
            │              ▲              │       │
            │              │              │       │
            │              │              │       │
            └── creates ───┴─── tasks ◄───┘       │
                         │                       │
                         ▼                       │
                  task_assignees                  │
                         │                       │
                         ▼                       │
                       users ◄───────────────────┘
```

### 7.3 Model-to-Schema Mapping

| TypeScript Interface | PostgreSQL Table |
|-----------------------|------------------|
| `AuthUser extends UserSummary` | `users` |
| `Project` | `projects` (+ `board_columns` via columns field) |
| `Task` | `tasks` (+ `users` via assignees field) |
| `BoardColumn` | `board_columns` |
| `PermissionSet` | Computed by `project.service.js` based on role |

---

## 8. Design Decisions & Rationale

### 8.1 Architecture Selection Rationale

**Three-Tier over MVC:**
- The codebase uses a three-tier (presentation, business, data) rather than traditional MVC
- Controllers act as the "View" adapter (converts HTTP to service calls)
- Services implement business logic (Model)
- React handles presentation (View)

**Express.js Backend:**
- Lightweight and flexible for REST API development
- Extensive middleware ecosystem (cors, body-parser)
- Easy to organize routes and handlers

**React + TypeScript Frontend:**
- Component-based architecture for reusable UI
- TypeScript provides compile-time type safety
- Strong ecosystem for drag-and-drop (hello-pangea/dnd)

**PostgreSQL Database:**
- Relational data fits well with task/project structures
- JSON aggregation support for returning assignees
- UUID extension for distributed ID generation

### 8.2 Advantages

**Separation of Concerns:**
- Clear boundaries between layers allow independent development
- Frontend developers can work on UI without knowing database schema
- Backend developers can optimize queries without touching UI

**Maintainability:**
- Services encapsulate business logic, making it reusable
- Controllers are thin, only handling HTTP concerns
- Database queries are isolated in services

**Scalability:**
- Connection pooling prevents database overload
- Stateless API allows horizontal scaling
- Docker Compose enables easy container orchestration

**Security:**
- JWT tokens for stateless authentication
- bcrypt for password hashing
- Role-based middleware for authorization
- Parameterized SQL queries prevent injection

### 8.3 Limitations and Trade-offs

**Current Limitations:**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No WebSocket | No real-time updates | Polling could be added |
| Single Database | No horizontal scaling | Read replicas possible |
| No ORM | Manual SQL writing | Error-prone, verbose |
| Global CORS Policy | `origin: '*'` | Security risk in production |

**Trade-offs:**

| Decision | Trade-off |
|----------|-----------|
| No ORM | More control, but more boilerplate SQL |
| React SPA | Better UX, but SEO challenges |
| JWT in localStorage | Convenient, but XSS vulnerable |
| Client-side position | Fast UI, but potential sync issues |

---

## 9. Suggestions for Improvement

### 9.1 Architectural Improvements

**1. Introduce an ORM Layer**

```javascript
// Current: Manual SQL
const result = await db.query(
  `SELECT * FROM tasks WHERE project_id = $1`,
  [projectId]
);

// Suggested: Prisma or Sequelize
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: { assignees: true }
});
```

**Benefits**: Type safety, migrations, easier queries, prevents SQL injection.

**2. Implement Real-Time Updates with WebSocket**

Add Socket.io for live collaboration:
```javascript
// Server: Emit on task update
io.to(projectId).emit('task:updated', task);

// Client: Subscribe to updates
socket.on('task:updated', (task) => {
  setTasks(prev => prev.map(t => t.id === task.id ? task : t));
});
```

**3. Add API Validation Layer**

Use a schema validation library (Joi, Zod, class-validator):
```javascript
// Instead of manual validation in controllers
const schema = z.object({
  title: z.string().min(1).max(255),
  status: z.enum(['todo', 'in-progress', 'done']),
});
```

### 9.2 Security Enhancements

**1. Fix CORS Configuration**
```javascript
// Current (insecure)
app.use(cors({ origin: '*' }));

// Suggested
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true
}));
```

**2. Add Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

**3. Move JWT to HttpOnly Cookies**
```javascript
// Instead of localStorage
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### 9.3 Code Quality Improvements

**1. Extract Constants to Configuration**
```javascript
// Current: Hardcoded in constants.js
const STATUSES = ['todo', 'in-progress', 'done'];

// Suggested: Environment-based
const STATUSES = process.env.TASK_STATUSES.split(',');
```

**2. Add Request Logging**
```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

**3. Implement Health Check Endpoint**
```javascript
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabase();
  res.json({ status: dbHealthy ? 'healthy' : 'unhealthy' });
});
```

### 9.4 Performance Optimizations

**1. Add Database Indexes**
```sql
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignees_user ON task_assignees(user_id);
```

**2. Implement Response Caching**
```javascript
const cacheMiddleware = require('./middleware/cache');
app.use('/api/projects', cacheMiddleware(300)); // 5 min cache
```

**3. Add Pagination**
```javascript
// TaskService: Limit results
const result = await db.query(
  `SELECT * FROM tasks WHERE project_id = $1 LIMIT $2 OFFSET $3`,
  [projectId, limit, offset]
);
```

### 9.5 Testing Strategy

**1. Add Unit Tests for Services**
```javascript
describe('TaskService', () => {
  test('create should return task with assignees');
  test('update should handle status change');
});
```

**2. Add Integration Tests**
```javascript
supertest(app)
  .post('/api/tasks')
  .set('Authorization', `Bearer ${token}`)
  .send({ title: 'Test' })
  .expect(201);
```

---

## Summary

TeamTask demonstrates a well-structured three-tier architecture with clear separation between presentation, business logic, and data layers. The system implements role-based access control, transactional database operations, and a modern React frontend with drag-and-drop capabilities.

Key architectural strengths include:
- Clear module boundaries (Auth, User, Project, Task)
- Transactional operations for data integrity
- JWT-based stateless authentication
- Reusable service layer pattern

Areas for improvement focus on security (CORS, JWT storage), performance (indexing, caching), and developer experience (ORM, validation libraries, testing).

---

*Document generated for IE108 - Software Analysis & Design course project.*
*Version: 2.0.0*
*Last Updated: April 2026*
