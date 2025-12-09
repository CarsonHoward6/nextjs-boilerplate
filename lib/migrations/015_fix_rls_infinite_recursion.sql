-- ============================================
-- Migration 015: Fix RLS Infinite Recursion
-- This fixes the circular dependency in admin RLS policies
-- ============================================

-- Step 1: Create a helper function to check admin status
-- This function uses SECURITY DEFINER to bypass RLS when checking admin status
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Step 2: Recreate user_roles policies without circular dependency
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow admins to view all roles (using helper function)
CREATE POLICY "Admins can view all roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Allow admins to insert roles
CREATE POLICY "Admins can insert roles"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
    ON user_roles FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
    ON user_roles FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Step 3: Recreate user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Step 4: Recreate user_courses policies
DROP POLICY IF EXISTS "Users can view their own course assignments" ON user_courses;
DROP POLICY IF EXISTS "Admins can view all course assignments" ON user_courses;
DROP POLICY IF EXISTS "Admins can create course assignments" ON user_courses;
DROP POLICY IF EXISTS "Admins can delete course assignments" ON user_courses;

CREATE POLICY "Users can view their own course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create course assignments"
    ON user_courses FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete course assignments"
    ON user_courses FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Step 5: Recreate user_sections policies (if they have the same issue)
DROP POLICY IF EXISTS "Users can view their assigned sections" ON user_sections;
DROP POLICY IF EXISTS "Admins can view all section assignments" ON user_sections;
DROP POLICY IF EXISTS "Admins can create section assignments" ON user_sections;
DROP POLICY IF EXISTS "Admins can delete section assignments" ON user_sections;

CREATE POLICY "Users can view their assigned sections"
    ON user_sections FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create section assignments"
    ON user_sections FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete section assignments"
    ON user_sections FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- ============================================
-- Migration Complete
-- This fixes infinite recursion in RLS policies
-- Run this in Supabase SQL Editor
-- ============================================
