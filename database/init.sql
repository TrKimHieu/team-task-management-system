CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    color VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    assignee_id UUID REFERENCES members(id),
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (name, icon) VALUES 
('Product Roadmap', '🚀'),
('Marketing Campaign', '📢')
ON CONFLICT DO NOTHING;

INSERT INTO members (name, avatar, color) VALUES 
('Quynh Truong', 'QT', 'bg-blue-500'),
('Alex Johnson', 'AJ', 'bg-emerald-500'),
('Sarah Smith', 'SS', 'bg-purple-500'),
('Mike Ross', 'MR', 'bg-amber-500')
ON CONFLICT DO NOTHING;
