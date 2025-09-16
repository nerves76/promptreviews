-- Database Schema Export for PromptReviews
-- Generated on: $(date)
-- Run this in your Supabase SQL Editor to export the current schema

-- =====================================================
-- 1. TABLE DEFINITIONS
-- =====================================================

-- Get all tables in the public schema
SELECT 
    'Table: ' || tablename || E'\n' ||
    'Owner: ' || tableowner || E'\n' ||
    'Has Indexes: ' || hasindexes || E'\n' ||
    'Has Rules: ' || hasrules || E'\n' ||
    'Has Triggers: ' || hastriggers || E'\n' ||
    'Row Security: ' || rowsecurity || E'\n' ||
    '---' as table_info
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 2. COLUMN DEFINITIONS
-- =====================================================

-- Get detailed column information for all tables
SELECT 
    'Table: ' || t.table_name || E'\n' ||
    'Column: ' || c.column_name || E'\n' ||
    'Type: ' || c.data_type || 
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN '(' || c.character_maximum_length || ')'
        ELSE ''
    END || E'\n' ||
    'Nullable: ' || c.is_nullable || E'\n' ||
    'Default: ' || COALESCE(c.column_default, 'NULL') || E'\n' ||
    'Position: ' || c.ordinal_position || E'\n' ||
    '---' as column_info
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Get all indexes
SELECT 
    'Table: ' || tablename || E'\n' ||
    'Index: ' || indexname || E'\n' ||
    'Definition: ' || indexdef || E'\n' ||
    '---' as index_info
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 4. CONSTRAINTS
-- =====================================================

-- Get all constraints (primary keys, foreign keys, unique, check)
SELECT 
    'Table: ' || tc.table_name || E'\n' ||
    'Constraint: ' || tc.constraint_name || E'\n' ||
    'Type: ' || tc.constraint_type || E'\n' ||
    'Column: ' || kcu.column_name || E'\n' ||
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' 
        THEN 'References: ' || ccu.table_name || '.' || ccu.column_name
        ELSE ''
    END || E'\n' ||
    '---' as constraint_info
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Get all Row Level Security policies
SELECT 
    'Table: ' || tablename || E'\n' ||
    'Policy: ' || policyname || E'\n' ||
    'Permissive: ' || permissive || E'\n' ||
    'Roles: ' || array_to_string(roles, ', ') || E'\n' ||
    'Command: ' || cmd || E'\n' ||
    'Qualification: ' || COALESCE(qual, 'NULL') || E'\n' ||
    'With Check: ' || COALESCE(with_check, 'NULL') || E'\n' ||
    '---' as policy_info
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Get all functions
SELECT 
    'Function: ' || p.proname || E'\n' ||
    'Definition: ' || E'\n' || pg_get_functiondef(p.oid) || E'\n' ||
    '---' as function_info
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Get all triggers
SELECT 
    'Table: ' || t.tgrelid::regclass || E'\n' ||
    'Trigger: ' || t.tgname || E'\n' ||
    'Function: ' || p.proname || E'\n' ||
    'Events: ' || 
    CASE WHEN t.tgtype & 66 > 0 THEN 'INSERT ' ELSE '' END ||
    CASE WHEN t.tgtype & 130 > 0 THEN 'UPDATE ' ELSE '' END ||
    CASE WHEN t.tgtype & 258 > 0 THEN 'DELETE ' ELSE '' END || E'\n' ||
    '---' as trigger_info
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
    AND NOT t.tgisinternal
ORDER BY t.tgrelid::regclass, t.tgname;

-- =====================================================
-- 7. SCHEMA SUMMARY
-- =====================================================

-- Create a summary of the database structure
WITH table_summary AS (
    SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count,
        COUNT(CASE WHEN c.column_name LIKE '%id%' THEN 1 END) as id_columns,
        COUNT(CASE WHEN c.data_type = 'uuid' THEN 1 END) as uuid_columns,
        COUNT(CASE WHEN c.data_type = 'jsonb' THEN 1 END) as jsonb_columns
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.table_schema = 'public'
    GROUP BY t.table_name
),
index_summary AS (
    SELECT 
        tablename,
        COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename
),
policy_summary AS (
    SELECT 
        tablename,
        COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT 
    'DATABASE SCHEMA SUMMARY' || E'\n' ||
    '=======================' || E'\n' ||
    'Total Tables: ' || COUNT(*) || E'\n' ||
    'Total Columns: ' || SUM(column_count) || E'\n' ||
    'Total ID Columns: ' || SUM(id_columns) || E'\n' ||
    'Total UUID Columns: ' || SUM(uuid_columns) || E'\n' ||
    'Total JSONB Columns: ' || SUM(jsonb_columns) || E'\n' ||
    'Total Indexes: ' || COALESCE((SELECT SUM(index_count) FROM index_summary), 0) || E'\n' ||
    'Total RLS Policies: ' || COALESCE((SELECT SUM(policy_count) FROM policy_summary), 0) || E'\n' ||
    '---' as summary
FROM table_summary;

-- =====================================================
-- 8. TABLE DETAILS BY TABLE
-- =====================================================

-- Get detailed breakdown for each table
SELECT 
    'DETAILED TABLE: ' || t.table_name || E'\n' ||
    '================' || E'\n' ||
    'Columns:' || E'\n' ||
    STRING_AGG(
        '  - ' || c.column_name || ' (' || c.data_type || 
        CASE WHEN c.character_maximum_length IS NOT NULL 
             THEN '(' || c.character_maximum_length || ')'
             ELSE ''
        END || ')' ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN c.column_default IS NOT NULL 
             THEN ' DEFAULT ' || c.column_default
             ELSE ''
        END,
        E'\n' ORDER BY c.ordinal_position
    ) || E'\n' ||
    '---' as table_details
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name; 