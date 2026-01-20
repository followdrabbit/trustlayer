-- TrustLayer Database Initialization Script
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for modular architecture
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS risk_management;
CREATE SCHEMA IF NOT EXISTS policy_management;

-- Set search path
ALTER DATABASE trustlayer SET search_path TO public, governance, risk_management, policy_management;

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'analyst', 'auditor', 'viewer', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA governance TO trustlayer;
GRANT USAGE ON SCHEMA risk_management TO trustlayer;
GRANT USAGE ON SCHEMA policy_management TO trustlayer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustlayer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA governance TO trustlayer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustlayer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA governance TO trustlayer;

-- Enable Row Level Security globally
ALTER DATABASE trustlayer SET row_security = on;

-- Set timezone
SET timezone = 'America/Sao_Paulo';

-- Logging configuration
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Create health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS TABLE (
    status TEXT,
    timestamp TIMESTAMPTZ,
    database_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'healthy'::TEXT,
        NOW(),
        pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql;

-- Initialize complete
SELECT 'TrustLayer database initialized successfully' AS message;
