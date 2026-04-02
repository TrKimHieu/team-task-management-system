-- Enable extension (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Import schema
\i schema/01_project.sql
\i schema/02_member.sql
\i schema/03_task.sql

-- Import seed data
\i seed/seed_data.sql