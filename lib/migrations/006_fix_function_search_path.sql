-- =====================================================
-- Fix Function Search Path Security Issue
-- This migration recreates the update_updated_at_column
-- function with an immutable search_path to prevent
-- potential security vulnerabilities
-- =====================================================

-- Drop the existing function and its dependent triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate the function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the security setting
COMMENT ON FUNCTION update_updated_at_column() IS
'Automatically updates the updated_at column to current timestamp.
Uses SECURITY DEFINER with explicit search_path for security.';

-- Recreate all triggers (they should already exist, but ensuring they're properly configured)
-- Block table
DROP TRIGGER IF EXISTS update_block_updated_at ON block;
CREATE TRIGGER update_block_updated_at
    BEFORE UPDATE ON block
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Course table
DROP TRIGGER IF EXISTS update_course_updated_at ON course;
CREATE TRIGGER update_course_updated_at
    BEFORE UPDATE ON course
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Page table
DROP TRIGGER IF EXISTS update_page_updated_at ON page;
CREATE TRIGGER update_page_updated_at
    BEFORE UPDATE ON page
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Section table
DROP TRIGGER IF EXISTS update_section_updated_at ON section;
CREATE TRIGGER update_section_updated_at
    BEFORE UPDATE ON section
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Announcements table
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Function search_path security issue fixed!';
    RAISE NOTICE 'The update_updated_at_column function now uses SET search_path for security.';
END $$;
