CREATE TABLE tasks (
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