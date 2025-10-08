-- Query to check existing tables and their columns
-- Run this in Supabase SQL Editor to see what's already in your database

-- List all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if our specific tables exist
SELECT 
  'user_accounts' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_accounts'
  ) as exists;

SELECT 
  'user_positions' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_positions'
  ) as exists;

SELECT 
  'user_trades' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_trades'
  ) as exists;

-- List all columns for user_accounts table (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_accounts'
ORDER BY ordinal_position;

-- List all columns for user_positions table (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_positions'
ORDER BY ordinal_position;

-- List all columns for user_trades table (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_trades'
ORDER BY ordinal_position;

-- Check for existing triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR event_object_schema = 'auth'
ORDER BY trigger_name;

-- Check for existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
