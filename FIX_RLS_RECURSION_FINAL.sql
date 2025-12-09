-- ==============================================================================
-- FIX RLS INFINITE RECURSION FINAL
-- ==============================================================================
-- This script fixes the "infinite recursion" error by replacing recursive RLS policies
-- with SECURITY DEFINER functions that safely bypass RLS to check permissions.
-- ==============================================================================

-- 1. Helper Function: Safely check if user is a teacher of a section
-- Runs as owner (bypasses RLS) to prevent recursion when querying user_sections
CREATE OR REPLACE FUNCTION public.get_teaching_section_ids(user_id UUID)
RETURNS TABLE (section_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT us.section_id
    FROM user_sections us
    WHERE us.user_id = user_id
    AND us.role IN ('teacher', 'teacher_assistant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop Problematic Policies on user_sections
DROP POLICY IF EXISTS "Teachers can view their section assignments" ON user_sections;
-- Also drop others just to be sure we are rebuilding cleanly
DROP POLICY IF EXISTS "Users can view their own section assignments" ON user_sections;
DROP POLICY IF EXISTS "Admins can view all section assignments" ON user_sections;

-- 3. Recreate user_sections Policies
-- Simple self-view (safe)
CREATE POLICY "Users can view their own section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admin view (safe via is_admin function from previous fix, ensuring it exists)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_admin_role BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = check_user_id
        AND role = 'admin'
    ) INTO has_admin_role;
    RETURN COALESCE(has_admin_role, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can view all section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Teacher view (FIXED using helper function)
CREATE POLICY "Teachers can view their section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (
        section_id IN ( SELECT * FROM public.get_teaching_section_ids(auth.uid()) )
    );

-- 4. Fix potential recursion in user_profiles for Teachers
DROP POLICY IF EXISTS "Teachers can view their students profiles" ON user_profiles;

CREATE POLICY "Teachers can view their students profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT DISTINCT us.user_id
            FROM user_sections us
            WHERE us.section_id IN (
                -- Use the safe function to get the current user's taught sections
                SELECT * FROM public.get_teaching_section_ids(auth.uid())
            )
        )
    );

-- 5. Ensure user_courses is safe (usually simpler, but good to verify)
DROP POLICY IF EXISTS "Users can view their own course assignments" ON user_courses;
CREATE POLICY "Users can view their own course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_teaching_section_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Success Note
DO $$
BEGIN
    RAISE NOTICE 'Fixed RLS recursion for user_sections and related teacher policies.';
END $$;
