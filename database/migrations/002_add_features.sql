-- Migration: Add Comments, Attachments, Notifications, Labels tables
-- Run this after init_v2.sql

-- Create comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- Create attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task_assigned', 'task_updated', 'task_completed', 'comment_added', 'due_soon', 'project_invite')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create labels table
CREATE TABLE IF NOT EXISTS task_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT 'bg-slate-500',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_task_labels_project_id ON task_labels(project_id);

-- Create label assignments table (many-to-many)
CREATE TABLE IF NOT EXISTS task_label_assignments (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_task_label_assignments_label_id ON task_label_assignments(label_id);

-- Seed some default labels for existing projects
DO $$
DECLARE
    roadmap_project_id UUID;
    campaign_project_id UUID;
BEGIN
    SELECT id INTO roadmap_project_id FROM projects WHERE name = 'Product Roadmap' LIMIT 1;
    SELECT id INTO campaign_project_id FROM projects WHERE name = 'Marketing Campaign' LIMIT 1;

    IF roadmap_project_id IS NOT NULL THEN
        INSERT INTO task_labels (project_id, name, color) VALUES
            (roadmap_project_id, 'Frontend', 'bg-blue-500'),
            (roadmap_project_id, 'Backend', 'bg-green-500'),
            (roadmap_project_id, 'Bug', 'bg-red-500'),
            (roadmap_project_id, 'Feature', 'bg-purple-500'),
            (roadmap_project_id, 'Urgent', 'bg-orange-500')
        ON CONFLICT (project_id, name) DO NOTHING;
    END IF;

    IF campaign_project_id IS NOT NULL THEN
        INSERT INTO task_labels (project_id, name, color) VALUES
            (campaign_project_id, 'Design', 'bg-pink-500'),
            (campaign_project_id, 'Content', 'bg-yellow-500'),
            (campaign_project_id, 'Social Media', 'bg-sky-500'),
            (campaign_project_id, 'Priority', 'bg-rose-500')
        ON CONFLICT (project_id, name) DO NOTHING;
    END IF;
END $$;
