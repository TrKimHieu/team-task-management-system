# Database Analysis Report: TeamTask - Task Management System

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Entity-Relationship Diagram](#3-entity-relationship-diagram)
4. [Table Specifications](#4-table-specifications)
5. [Indexes and Constraints](#5-indexes-and-constraints)
6. [Seed Data](#6-seed-data)
7. [Schema Version Comparison](#7-schema-version-comparison)
8. [Database Relationships Summary](#8-database-relationships-summary)
9. [Data Flow Mapping](#9-data-flow-mapping)
10. [Design Analysis](#10-design-analysis)

---

## 1. Overview

### 1.1 Database System

| Property | Value |
|----------|-------|
| **Database Engine** | PostgreSQL 15 |
| **Connection Port** | 5432 |
| **Database Name** | app_db |
| **UUID Generation** | uuid-ossp extension |
| **Password Hashing** | pgcrypto extension (bcrypt via gen_salt) |

### 1.2 Database Purpose

The database serves as the persistent storage layer for the TeamTask task management application, supporting:
- User authentication and authorization
- Project and board management
- Kanban-style task organization
- Multi-user task assignment
- Role-based access control

---

## 2. File Structure

### 2.1 Database Directory Structure

```
database/
├── init.sql                    # Initial schema (legacy version)
├── init_v2.sql               # Current schema with all tables
├── schema/                    # Modular schema files
│   ├── 01_project.sql        # Project, Boards, Board_Columns
│   ├── 02_member.sql         # Users table
│   └── 03_task.sql           # Tasks and Task_Assignees
├── migrations/                # Schema evolution scripts
│   └── 001_add_completed_column.sql
└── seed/                     # Sample data
    └── seed_data.sql         # Legacy seed data
```

### 2.2 File Contents Summary

| File | Purpose | Tables Defined |
|------|---------|---------------|
| `init_v2.sql` | Complete database initialization (PRODUCTION) | All 7 tables + seed data |
| `init.sql` | Legacy schema (DEPRECATED) | projects, members, tasks |
| `schema/01_project.sql` | Project module schema | projects, project_members, boards, board_columns |
| `schema/02_member.sql` | User module schema | users |
| `schema/03_task.sql` | Task module schema | tasks, task_assignees |
| `migrations/001_add_completed_column.sql` | Schema evolution | Adds completed column to tasks |
| `seed/seed_data.sql` | Legacy sample data (DEPRECATED) | projects, members |

### 2.3 Schema Files vs init_v2.sql

```
┌─────────────────────────────────────────────────────────────────┐
│                    init_v2.sql (Canonical)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Extension Setup (uuid-ossp, pgcrypto)                   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Drop Tables (CASCADE order)                              │    │
│  │   1. task_assignees                                     │    │
│  │   2. tasks                                              │    │
│  │   3. board_columns                                      │    │
│  │   4. boards                                             │    │
│  │   5. project_members                                    │    │
│  │   6. projects                                           │    │
│  │   7. users                                              │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Create Tables                                           │    │
│  │   1. users (PRIMARY)                                    │    │
│  │   2. projects                                          │    │
│  │   3. project_members                                   │    │
│  │   4. boards                                            │    │
│  │   5. board_columns                                     │    │
│  │   6. tasks                                             │    │
│  │   7. task_assignees (JUNCTION)                          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Seed Data                                               │    │
│  │   - 4 users                                            │    │
│  │   - 2 projects                                         │    │
│  │   - 2 boards                                           │    │
│  │   - 6 board_columns (3 per board)                      │    │
│  │   - 6 project_members                                  │    │
│  │   - 3 tasks                                             │    │
│  │   - 4 task_assignees                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity-Relationship Diagram

### 3.1 Full ER Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE SCHEMA                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│    ┌─────────────┐                                                                │
│    │    USERS    │                                                                │
│    ├─────────────┤                                                                │
│    │ id (PK)    │◄──────────┐                                                     │
│    │ name        │           │                                                     │
│    │ email (UQ) │           │ created_by                                          │
│    │ password_hash│          │ (1:N)                                              │
│    │ role        │           │                                                     │
│    │ avatar      │           │                                                     │
│    │ color       │           │                                                     │
│    │ created_at  │           │                                                     │
│    │ updated_at  │           │                                                     │
│    └─────────────┘           │                                                     │
│          │                   │                                                     │
│          │ 1:N               │                                                     │
│          ├───────────────────┼───────────────────────────────────────────────────┤
│          │                   │                                                     │
│          │            ┌─────┴─────────────────────────────────┐                 │
│          │            │            PROJECTS                      │                 │
│          │            ├───────────────────────────────────────┤                 │
│          │            │ id (PK)                                │                 │
│          │            │ name                                   │                 │
│          │            │ description                            │                 │
│          │            │ icon                                  │                 │
│          │            │ created_by (FK) ──────────────────────►│                 │
│          │            │ created_at                             │                 │
│          │            │ updated_at                             │                 │
│          │            └─────────────────────────────────────────┘                 │
│          │                      │ 1:1                                           │
│          │                      ▼                                               │
│          │            ┌─────────────────────────────────┐                        │
│          │            │           BOARDS                 │                        │
│          │            ├─────────────────────────────────┤                        │
│          │            │ id (PK)                        │                        │
│          │            │ project_id (FK, UQ) ──────────►│                        │
│          │            │ name                            │                        │
│          │            │ created_at                      │                        │
│          │            └─────────────────────────────────┘                        │
│          │                      │ 1:N                                           │
│          │                      ▼                                               │
│          │            ┌─────────────────────────────────┐                        │
│          │            │       BOARD_COLUMNS              │                        │
│          │            ├─────────────────────────────────┤                        │
│          │            │ id (PK)                        │                        │
│          │            │ board_id (FK) ────────────────►│                        │
│          │            │ key (UQ with board_id)          │                        │
│          │            │ name                            │                        │
│          │            │ position (UQ with board_id)      │                        │
│          │            │ created_at                      │                        │
│          │            └─────────────────────────────────┘                        │
│          │                                                            │           │
│          │ 1:N                                                        │ N:1        │
│          │                                                            ▼           │
│          │    ┌─────────────────────────────────────────────────────────────────┐│
│          │    │                         TASKS                                     ││
│          │    ├─────────────────────────────────────────────────────────────────┤│
│          │    │ id (PK)                                                        ││
│          │    │ project_id (FK) ─────────────────────────────────────────────►││
│          │    │ board_column_id (FK) ◄───────────────────────────────────────││
│          │    │ title                                                          ││
│          │    │ description                                                    ││
│          │    │ created_by (FK) ─────────────────────────────────────────────►││
│          │    │ status                                                         ││
│          │    │ priority                                                       ││
│          │    │ due_date                                                       ││
│          │    │ position                                                       ││
│          │    │ completed                                                      ││
│          │    │ created_at                                                     ││
│          │    │ updated_at                                                     ││
│          │    └─────────────────────────────────────────────────────────────────┘│
│          │            │                                                        │
│          │            │ 1:N                                                    │
│          │            ▼                                                        │
│          │    ┌─────────────────────┐                                          │
│          │    │   TASK_ASSIGNEES   │                                          │
│          │    ├─────────────────────┤                                          │
│          │    │ task_id (FK, PK)   │◄─────────────────────────┐                │
│          │    │ user_id (FK, PK)   │◄─────────────────────────┤                │
│          │    │ assigned_at        │                          │                │
│          │    └─────────────────────┘                          │                │
│          │                                                      │                │
│          │ 1:N                                                  │ 1:N             │
│          └──────────────────────────────────────────────────────┘                │
│                                                                                   │
│    ┌─────────────────────────────────────────────────────────────────────────────┐│
│    │                       PROJECT_MEMBERS                                        ││
│    ├─────────────────────────────────────────────────────────────────────────────┤│
│    │ project_id (FK, PK) ──────────────────────────────────────────────────────►││
│    │ user_id (FK, PK) ─────────────────────────────────────────────────────────►││
│    │ project_role                                                                ││
│    │ joined_at                                                                   ││
│    └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 ER Notation Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| Users → Projects | 1:N | One user can create many projects |
| Users → Tasks | 1:N | One user can create many tasks |
| Users ↔ Tasks | M:N | Through task_assignees (many assignees per task) |
| Users ↔ Projects | M:N | Through project_members (many members per project) |
| Projects → Boards | 1:1 | Each project has exactly one board |
| Boards → Board_Columns | 1:N | Each board has multiple columns |
| Projects → Tasks | 1:N | Each project contains many tasks |
| Tasks → Board_Columns | N:1 | Each task belongs to one column |

---

## 4. Table Specifications

### 4.1 USERS Table

**File Location:** `database/init_v2.sql` (lines 12-22), `database/schema/02_member.sql`

**Purpose:** Stores user account information and authentication data.

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('member', 'leader', 'admin')),
    avatar VARCHAR(10),
    color VARCHAR(20) NOT NULL DEFAULT 'bg-slate-500',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated unique identifier |
| name | VARCHAR(50) | NOT NULL | User display name (max 50 chars) |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Login email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(20) | NOT NULL, CHECK | member/leader/admin |
| avatar | VARCHAR(10) | NULL | 2-character initials |
| color | VARCHAR(20) | NOT NULL, DEFAULT | CSS color class for avatar |
| created_at | TIMESTAMP | NOT NULL, DEFAULT | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT | Last profile update time |

**Indexes:** PRIMARY KEY (id), UNIQUE (email)

---

### 4.2 PROJECTS Table

**File Location:** `database/init_v2.sql` (lines 24-32), `database/schema/01_project.sql`

**Purpose:** Stores project metadata and information.

```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated unique identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| icon | VARCHAR(50) | NULL | Emoji icon for project |
| created_by | UUID | NOT NULL, FK → users | Project creator |
| created_at | TIMESTAMP | NOT NULL, DEFAULT | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT | Last update timestamp |

**Indexes:** PRIMARY KEY (id)

**Foreign Keys:**
- `created_by` REFERENCES users(id) ON DELETE RESTRICT

---

### 4.3 PROJECT_MEMBERS Table

**File Location:** `database/init_v2.sql` (lines 34-40), `database/schema/01_project.sql`

**Purpose:** Manages many-to-many relationship between users and projects with project-specific roles.

```sql
CREATE TABLE IF NOT EXISTS project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (project_role IN ('member', 'leader', 'admin')),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| project_id | UUID | NOT NULL, FK, PK | Project reference |
| user_id | UUID | NOT NULL, FK, PK | User reference |
| project_role | VARCHAR(20) | NOT NULL, DEFAULT | Role within project |
| joined_at | TIMESTAMP | NOT NULL, DEFAULT | When user joined project |

**Indexes:** PRIMARY KEY (project_id, user_id)

**Foreign Keys:**
- `project_id` REFERENCES projects(id) ON DELETE CASCADE
- `user_id` REFERENCES users(id) ON DELETE CASCADE

**Behavior:** When a project or user is deleted, membership is automatically removed.

---

### 4.4 BOARDS Table

**File Location:** `database/init_v2.sql` (lines 42-47), `database/schema/01_project.sql`

**Purpose:** Represents the Kanban board associated with each project.

```sql
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated unique identifier |
| project_id | UUID | NOT NULL, UNIQUE, FK | Associated project |
| name | VARCHAR(255) | NOT NULL | Board display name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT | Creation timestamp |

**Indexes:** PRIMARY KEY (id), UNIQUE (project_id)

**Foreign Keys:**
- `project_id` REFERENCES projects(id) ON DELETE CASCADE

**Design Note:** One-to-one relationship with projects ensures each project has exactly one board.

---

### 4.5 BOARD_COLUMNS Table

**File Location:** `database/init_v2.sql` (lines 49-58), `database/schema/01_project.sql`

**Purpose:** Stores the columns within each board (To Do, In Progress, Done).

```sql
CREATE TABLE IF NOT EXISTS board_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    key VARCHAR(30) NOT NULL CHECK (key IN ('todo', 'in-progress', 'done')),
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (board_id, key),
    UNIQUE (board_id, position)
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated unique identifier |
| board_id | UUID | NOT NULL, FK | Parent board |
| key | VARCHAR(30) | NOT NULL, CHECK | todo/in-progress/done |
| name | VARCHAR(100) | NOT NULL | Column display name |
| position | INTEGER | NOT NULL | Column order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT | Creation timestamp |

**Indexes:** PRIMARY KEY (id), UNIQUE (board_id, key), UNIQUE (board_id, position)

**Foreign Keys:**
- `board_id` REFERENCES boards(id) ON DELETE CASCADE

**Allowed Values for `key`:**
- `todo` - Tasks to be done
- `in-progress` - Tasks currently being worked on
- `done` - Completed tasks

---

### 4.6 TASKS Table

**File Location:** `database/init_v2.sql` (lines 60-74), `database/schema/03_task.sql`

**Purpose:** Core entity storing task information and Kanban state.

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    board_column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated unique identifier |
| project_id | UUID | NOT NULL, FK | Parent project |
| board_column_id | UUID | NOT NULL, FK | Current column on board |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | NULL | Task details |
| created_by | UUID | NOT NULL, FK | Task creator |
| status | VARCHAR(20) | NOT NULL, DEFAULT, CHECK | Current status |
| priority | VARCHAR(10) | NOT NULL, DEFAULT, CHECK | Priority level |
| due_date | TIMESTAMP | NULL | Task deadline |
| position | INTEGER | NOT NULL, DEFAULT | Order within column |
| completed | BOOLEAN | DEFAULT FALSE | Completion flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT | Last update timestamp |

**Indexes:** PRIMARY KEY (id)

**Foreign Keys:**
- `project_id` REFERENCES projects(id) ON DELETE CASCADE
- `board_column_id` REFERENCES board_columns(id) ON DELETE RESTRICT
- `created_by` REFERENCES users(id) ON DELETE RESTRICT

**Allowed Values:**

| Field | Allowed Values |
|-------|----------------|
| status | `todo`, `in-progress`, `done` |
| priority | `low`, `medium`, `high` |

**Design Note:** `completed` is separate from `status` to allow marking tasks done without changing their column position.

---

### 4.7 TASK_ASSIGNEES Table

**File Location:** `database/init_v2.sql` (lines 76-81), `database/schema/03_task.sql`

**Purpose:** Junction table for many-to-many relationship between tasks and users.

```sql
CREATE TABLE IF NOT EXISTS task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| task_id | UUID | NOT NULL, FK, PK | Task reference |
| user_id | UUID | NOT NULL, FK, PK | User reference |
| assigned_at | TIMESTAMP | NOT NULL, DEFAULT | Assignment timestamp |

**Indexes:** PRIMARY KEY (task_id, user_id)

**Foreign Keys:**
- `task_id` REFERENCES tasks(id) ON DELETE CASCADE
- `user_id` REFERENCES users(id) ON DELETE CASCADE

**Behavior:** When a task or user is deleted, assignments are automatically removed.

---

## 5. Indexes and Constraints

### 5.1 Primary Keys

| Table | Primary Key | Type |
|-------|-------------|------|
| users | id | UUID |
| projects | id | UUID |
| boards | id | UUID |
| board_columns | id | UUID |
| tasks | id | UUID |
| project_members | (project_id, user_id) | Composite |
| task_assignees | (task_id, user_id) | Composite |

### 5.2 Unique Constraints

| Table | Constraint | Columns |
|-------|-------------|---------|
| users | email | email |
| boards | project_id | project_id |
| board_columns | key | (board_id, key) |
| board_columns | position | (board_id, position) |
| project_members | membership | (project_id, user_id) |
| task_assignees | assignment | (task_id, user_id) |

### 5.3 Foreign Keys

| Table | Foreign Key | References | ON DELETE |
|-------|-------------|------------|-----------|
| projects | created_by | users(id) | RESTRICT |
| boards | project_id | projects(id) | CASCADE |
| board_columns | board_id | boards(id) | CASCADE |
| tasks | project_id | projects(id) | CASCADE |
| tasks | board_column_id | board_columns(id) | RESTRICT |
| tasks | created_by | users(id) | RESTRICT |
| project_members | project_id | projects(id) | CASCADE |
| project_members | user_id | users(id) | CASCADE |
| task_assignees | task_id | tasks(id) | CASCADE |
| task_assignees | user_id | users(id) | CASCADE |

### 5.4 Check Constraints

| Table | Column | Constraint |
|-------|--------|------------|
| users | role | IN ('member', 'leader', 'admin') |
| project_members | project_role | IN ('member', 'leader', 'admin') |
| board_columns | key | IN ('todo', 'in-progress', 'done') |
| tasks | status | IN ('todo', 'in-progress', 'done') |
| tasks | priority | IN ('low', 'medium', 'high') |

### 5.5 Default Values

| Table | Column | Default |
|-------|--------|---------|
| All tables | id | uuid_generate_v4() |
| All tables | created_at | CURRENT_TIMESTAMP |
| users, projects, tasks | updated_at | CURRENT_TIMESTAMP |
| users | color | 'bg-slate-500' |
| tasks | status | 'todo' |
| tasks | priority | 'medium' |
| tasks | position | 0 |
| tasks | completed | FALSE |
| project_members | project_role | 'member' |

---

## 6. Seed Data

### 6.1 Seed Data Location

**Production seed data:** `database/init_v2.sql` (lines 83-166)

**Legacy seed data:** `database/seed/seed_data.sql`

### 6.2 Default Users

| Name | Email | Password | Role | Avatar | Color |
|------|-------|----------|------|--------|-------|
| System Admin | admin@teamtask.local | Admin@123 | admin | SA | bg-rose-500 |
| Linh Leader | leader@teamtask.local | Leader@123 | leader | LL | bg-blue-500 |
| Minh Member | member@teamtask.local | Member@123 | member | MM | bg-emerald-500 |
| An Member | member2@teamtask.local | Member@123 | member | AM | bg-amber-500 |

**Note:** Passwords are hashed using PostgreSQL's `crypt()` function with bcrypt salt.

### 6.3 Sample Projects

| Name | Description | Icon | Created By |
|------|-------------|------|------------|
| Product Roadmap | Quarterly roadmap and delivery planning. | 🚀 | Linh Leader |
| Marketing Campaign | Launch campaign planning and execution. | 📢 | System Admin |

### 6.4 Board Structure (Per Project)

| Key | Name | Position |
|-----|------|----------|
| todo | To Do | 1 |
| in-progress | In Progress | 2 |
| done | Done | 3 |

### 6.5 Sample Tasks

| Title | Description | Status | Priority | Project | Column |
|-------|-------------|--------|----------|---------|--------|
| Design System Update | Refresh color palette and shared components. | todo | high | Product Roadmap | To Do |
| API Integration | Connect frontend to the authenticated backend. | in-progress | medium | Product Roadmap | In Progress |
| Social Media Assets | Prepare launch assets for all social channels. | done | low | Marketing Campaign | Done |

### 6.6 Task Assignments

| Task | Assignee(s) |
|------|-------------|
| Design System Update | Minh Member, An Member |
| API Integration | Minh Member |
| Social Media Assets | Linh Leader |

---

## 7. Schema Version Comparison

### 7.1 Legacy Schema (init.sql) vs Current Schema (init_v2.sql)

| Aspect | Legacy (init.sql) | Current (init_v2.sql) |
|--------|-------------------|------------------------|
| **Status** | DEPRECATED | ACTIVE |
| **Users** | members table (no auth) | users table with auth |
| **Password** | None | bcrypt hash |
| **Roles** | None | member/leader/admin |
| **Task Assignment** | Single assignee_id | M:N via task_assignees |
| **Board Structure** | Implicit via status | Explicit board_columns |
| **Position** | Not supported | Supported |
| **Completed** | Not supported | Supported |
| **Timestamps** | created_at only | created_at + updated_at |
| **Referential Integrity** | Basic | Full with CASCADE |

### 7.2 Schema Evolution

**Migration File:** `database/migrations/001_add_completed_column.sql`

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
```

**Purpose:** Adds completion flag to tasks table without recreating the table.

---

## 8. Database Relationships Summary

### 8.1 Relationship Matrix

```
          ┌────────┬─────────┬──────────┬────────┬──────────┬───────┬───────────────┐
          │ Users  │Projects │Boards    │Columns │Tasks     │ProjMem│TaskAssignees  │
┌─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│ Users   │   -    │   1:N   │    -     │   -    │   1:N    │  M:N  │     M:N       │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│Projects │  N:1   │   -     │   1:1    │   -    │   1:N    │  1:N  │      -        │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│Boards   │   -    │   1:1   │    -     │  1:N   │    -     │   -   │      -        │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│Columns  │   -    │   -     │   N:1    │   -    │   N:1    │   -   │      -        │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│Tasks    │  N:1   │   N:1   │    -     │  1:N   │    -     │   -   │     M:N       │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│ProjMem  │  M:N   │   M:N   │    -     │   -    │    -     │   -   │      -        │
├─────────┼────────┼─────────┼──────────┼────────┼──────────┼───────┼───────────────┤
│TaskAssgn│  M:N   │   -     │    -     │   -    │   M:N    │   -   │      -        │
└─────────┴────────┴─────────┴──────────┴────────┴──────────┴───────┴───────────────┘
```

### 8.2 Deletion Behavior Summary

| Parent | Child | ON DELETE |
|--------|-------|-----------|
| users | projects | RESTRICT (cannot delete if projects exist) |
| users | tasks | RESTRICT (cannot delete if tasks exist) |
| users | project_members | CASCADE (membership removed) |
| users | task_assignees | CASCADE (assignments removed) |
| projects | boards | CASCADE (board deleted) |
| projects | tasks | CASCADE (tasks deleted) |
| projects | project_members | CASCADE (membership removed) |
| boards | board_columns | CASCADE (columns deleted) |
| board_columns | tasks | RESTRICT (cannot delete if tasks exist) |
| tasks | task_assignees | CASCADE (assignments removed) |

---

## 9. Data Flow Mapping

### 9.1 Backend Database Operations

#### Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ auth.service │ ──► │ users table  │ ──► │  PostgreSQL  │
│ .login()     │     │ .getByEmail  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
     │
     ├── SELECT * FROM users WHERE email = $1
     └── Returns: { id, email, password_hash, role, ... }
```

#### Project Creation Flow

```
┌──────────────────┐     ┌──────────────────┐
│ project.service  │     │ Transaction      │
│ .create()        │ ──► │ BEGIN            │
└──────────────────┘     └──────────────────┘
     │                         │
     │  ┌──────────────────────┴──────────────────────┐
     │  │                                               │
     ▼  ▼                                               ▼
┌──────────┐  ┌──────────┐  ┌────────────────┐  ┌────────────┐
│ projects │  │project_  │  │ boards         │  │board_      │
│  INSERT  │  │members   │  │ INSERT         │  │columns     │
│          │  │ INSERT   │  │                │  │ INSERT x3  │
└──────────┘  └──────────┘  └────────────────┘  └────────────┘
     │                         │
     │  ┌──────────────────────┴──────────────────────┐
     └──► COMMIT (or ROLLBACK on error)                │
                                                   ▼
                                            ┌──────────┐
                                            │ PostgreSQL│
                                            └──────────┘
```

#### Task Creation Flow

```
┌──────────────────┐     ┌──────────────────┐
│ task.service     │     │ Transaction      │
│ .create()        │ ──► │ BEGIN            │
└──────────────────┘     └──────────────────┘
     │                         │
     │  ┌───────────────────────┼─────────────────────────┐
     ▼  ▼                       ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐
│ tasks INSERT     │  │ getColumnIdFor   │  │ getNextPosition│
│ (with column_id) │  │ Status query     │  │ query         │
└──────────────────┘  └──────────────────┘  └────────────────┘
     │
     ▼
┌──────────────────┐
│ task_assignees   │
│ INSERT (for each │
│ assignee)        │
└──────────────────┘
     │
     │  ┌───────────────────────┴─────────────────────────┐
     └──► COMMIT ──► getById() ──► RETURN task          │
                                                   ▼
                                            ┌──────────┐
                                            │ PostgreSQL│
                                            └──────────┘
```

### 9.2 Query Patterns

#### Get All Tasks for Project (with Assignees)

```sql
-- From task.service.js getTaskBaseQuery()
SELECT
    t.*,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'role', u.role,
          'avatar', COALESCE(u.avatar, UPPER(LEFT(u.name, 2))),
          'color', COALESCE(u.color, 'bg-slate-500')
        )
      ) FILTER (WHERE u.id IS NOT NULL),
      '[]'::json
    ) AS assignees_json
FROM tasks t
LEFT JOIN task_assignees ta ON ta.task_id = t.id
LEFT JOIN users u ON u.id = ta.user_id
WHERE t.project_id = $1
GROUP BY t.id
ORDER BY t.status ASC, t.position ASC, t.created_at DESC;
```

---

## 10. Design Analysis

### 10.1 Design Patterns Identified

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Junction Table** | task_assignees, project_members | M:N relationships |
| **Surrogate Key** | UUID primary keys | Distributed ID generation |
| **Soft State** | completed BOOLEAN column | Task completion without column change |
| **Audit Columns** | created_at, updated_at | Track record lifecycle |
| **Composite Primary Key** | Junction tables | Prevent duplicate assignments |

### 10.2 Normalization Analysis

| Table | Normal Form | Assessment |
|-------|-------------|------------|
| users | 3NF | ✓ No transitive dependencies |
| projects | 3NF | ✓ All non-key attributes depend on PK |
| boards | 3NF | ✓ Only depends on project_id |
| board_columns | 3NF | ✓ Position/key depend only on PK |
| tasks | 3NF | ✓ All attributes functional on task PK |
| project_members | 3NF | ✓ Junction table, no redundancy |
| task_assignees | 3NF | ✓ Junction table, no redundancy |

### 10.3 Strengths

1. **Proper UUID Usage**: Leverages PostgreSQL's uuid-ossp for distributed ID generation
2. **Atomic Transactions**: Multi-table operations use BEGIN/COMMIT/ROLLBACK
3. **Referential Integrity**: Foreign keys with appropriate CASCADE/RESTRICT behavior
4. **Composite Keys**: Junction tables use composite PKs to prevent duplicates
5. **Status/Priority Enums**: CHECK constraints enforce valid values
6. **Timestamp Tracking**: created_at and updated_at on all major tables

### 10.4 Limitations

1. **No Indexes on Foreign Keys**: Query performance may degrade with large datasets
2. **No Soft Deletes**: Records are permanently deleted
3. **Limited Query Support**: No materialized views or partial indexes
4. **No Full-Text Search**: No GIN indexes for text search
5. **Position Not Scoped**: Task position is global, not per-project-per-status

### 10.5 Recommended Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_project_position ON tasks(project_id, position);
CREATE INDEX idx_tasks_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_board_columns_board_position ON board_columns(board_id, position);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_users_email ON users(email);
```

---

## Appendix A: Quick Reference

### All Tables Summary

| # | Table Name | Purpose | Primary Key | FK Count |
|---|------------|---------|-------------|----------|
| 1 | users | User accounts | id | 0 |
| 2 | projects | Project metadata | id | 1 (users) |
| 3 | project_members | User-Project membership | (project_id, user_id) | 2 |
| 4 | boards | Kanban board per project | id | 1 (projects) |
| 5 | board_columns | Board columns | id | 1 (boards) |
| 6 | tasks | Task details | id | 3 |
| 7 | task_assignees | Task-User assignment | (task_id, user_id) | 2 |

### File Location Index

```
database/
├── init_v2.sql                              # Main schema (166 lines)
│   ├── Lines 1-2: Extensions
│   ├── Lines 4-10: DROP statements
│   ├── Lines 12-22: users table
│   ├── Lines 24-32: projects table
│   ├── Lines 34-40: project_members table
│   ├── Lines 42-47: boards table
│   ├── Lines 49-58: board_columns table
│   ├── Lines 60-74: tasks table
│   ├── Lines 76-81: task_assignees table
│   ├── Lines 83-88: User seed data
│   └── Lines 90-166: Project/Board/Task seed data
│
├── schema/
│   ├── 01_project.sql                       # Project module (35 lines)
│   ├── 02_member.sql                        # Users module (11 lines)
│   └── 03_task.sql                          # Task module (22 lines)
│
├── migrations/
│   └── 001_add_completed_column.sql         # Migration (1 line)
│
└── seed/
    └── seed_data.sql                        # Legacy seed (9 lines)
```

---

*Document generated for IE108 - Software Analysis & Design course project.*
*Database Version: v2.0*
*Last Updated: April 2026*
