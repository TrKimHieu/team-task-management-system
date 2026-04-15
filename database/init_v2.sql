CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS task_assignees CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS board_columns CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (project_role IN ('member', 'leader', 'admin')),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

INSERT INTO users (name, email, password_hash, role, avatar, color)
VALUES
    ('System Admin', 'admin@teamtask.local', crypt('Admin@123', gen_salt('bf')), 'admin', 'SA', 'bg-rose-500'),
    ('Linh Leader', 'leader@teamtask.local', crypt('Leader@123', gen_salt('bf')), 'leader', 'LL', 'bg-blue-500'),
    ('Minh Member', 'member@teamtask.local', crypt('Member@123', gen_salt('bf')), 'member', 'MM', 'bg-emerald-500'),
    ('An Member', 'member2@teamtask.local', crypt('Member@123', gen_salt('bf')), 'member', 'AM', 'bg-amber-500');

DO $$
DECLARE
    admin_id UUID;
    leader_id UUID;
    member_id UUID;
    member_two_id UUID;
    roadmap_project_id UUID;
    campaign_project_id UUID;
    roadmap_board_id UUID;
    campaign_board_id UUID;
    roadmap_todo_id UUID;
    roadmap_progress_id UUID;
    campaign_done_id UUID;
    task_one_id UUID;
    task_two_id UUID;
    task_three_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@teamtask.local';
    SELECT id INTO leader_id FROM users WHERE email = 'leader@teamtask.local';
    SELECT id INTO member_id FROM users WHERE email = 'member@teamtask.local';
    SELECT id INTO member_two_id FROM users WHERE email = 'member2@teamtask.local';

    INSERT INTO projects (name, description, icon, created_by)
    VALUES
        ('Product Roadmap', 'Quarterly roadmap and delivery planning.', '🚀', leader_id),
        ('Marketing Campaign', 'Launch campaign planning and execution.', '📢', admin_id);

    SELECT id INTO roadmap_project_id FROM projects WHERE name = 'Product Roadmap' LIMIT 1;
    SELECT id INTO campaign_project_id FROM projects WHERE name = 'Marketing Campaign' LIMIT 1;

    INSERT INTO project_members (project_id, user_id, project_role)
    VALUES
        (roadmap_project_id, leader_id, 'leader'),
        (roadmap_project_id, member_id, 'member'),
        (roadmap_project_id, member_two_id, 'member'),
        (campaign_project_id, admin_id, 'admin'),
        (campaign_project_id, leader_id, 'leader'),
        (campaign_project_id, member_id, 'member');

    INSERT INTO boards (project_id, name)
    VALUES
        (roadmap_project_id, 'Product Roadmap Board'),
        (campaign_project_id, 'Marketing Campaign Board');

    SELECT id INTO roadmap_board_id FROM boards WHERE project_id = roadmap_project_id;
    SELECT id INTO campaign_board_id FROM boards WHERE project_id = campaign_project_id;

    INSERT INTO board_columns (board_id, key, name, position)
    VALUES
        (roadmap_board_id, 'todo', 'To Do', 1),
        (roadmap_board_id, 'in-progress', 'In Progress', 2),
        (roadmap_board_id, 'done', 'Done', 3),
        (campaign_board_id, 'todo', 'To Do', 1),
        (campaign_board_id, 'in-progress', 'In Progress', 2),
        (campaign_board_id, 'done', 'Done', 3);

    SELECT id INTO roadmap_todo_id FROM board_columns WHERE board_id = roadmap_board_id AND key = 'todo';
    SELECT id INTO roadmap_progress_id FROM board_columns WHERE board_id = roadmap_board_id AND key = 'in-progress';
    SELECT id INTO campaign_done_id FROM board_columns WHERE board_id = campaign_board_id AND key = 'done';

    INSERT INTO tasks (project_id, board_column_id, title, description, created_by, status, priority, due_date, position)
    VALUES
        (roadmap_project_id, roadmap_todo_id, 'Design System Update', 'Refresh color palette and shared components.', leader_id, 'todo', 'high', CURRENT_TIMESTAMP + INTERVAL '7 day', 1),
        (roadmap_project_id, roadmap_progress_id, 'API Integration', 'Connect frontend to the authenticated backend.', leader_id, 'in-progress', 'medium', CURRENT_TIMESTAMP + INTERVAL '5 day', 1),
        (campaign_project_id, campaign_done_id, 'Social Media Assets', 'Prepare launch assets for all social channels.', admin_id, 'done', 'low', CURRENT_TIMESTAMP + INTERVAL '10 day', 1);

    SELECT id INTO task_one_id FROM tasks WHERE title = 'Design System Update' LIMIT 1;
    SELECT id INTO task_two_id FROM tasks WHERE title = 'API Integration' LIMIT 1;
    SELECT id INTO task_three_id FROM tasks WHERE title = 'Social Media Assets' LIMIT 1;

    INSERT INTO task_assignees (task_id, user_id)
    VALUES
        (task_one_id, member_id),
        (task_one_id, member_two_id),
        (task_two_id, member_id),
        (task_three_id, leader_id);
END $$;
