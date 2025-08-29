
-- Main migration coordinator
-- This file orchestrates the execution of all migration scripts
-- Last updated: 2025-06-09

-- Load extensions
\i scripts/migrations/01-extensions.sql

-- Create schema
\i scripts/migrations/02-schema.sql

-- Create participants schema
\i scripts/migrations/create_participants_schema.sql

-- Create tables
\i scripts/migrations/03-tables.sql

-- Create views
\i scripts/migrations/04-views.sql

-- Create functions
\i scripts/migrations/05-functions.sql

-- Create triggers
\i scripts/migrations/06-triggers.sql

-- Create indices
\i scripts/migrations/07-indices.sql

-- Insert initial data
\i scripts/migrations/08-initial-data.sql

-- Setup permissions
\i scripts/migrations/09-permissions.sql

-- Setup lojas participantes (new)
\i scripts/migrations/10-lojas-participantes.sql
