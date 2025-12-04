-- =====================================================
-- Row Level Security (RLS) Policies for All Tables
-- This migration enables RLS and creates policies for:
-- - course, section, page, block, page_blocks, section_pages
-- - user_profiles, user_roles, user_sections
-- =====================================================

-- ==================== COURSE TABLE ====================
ALTER TABLE course ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view courses
DROP POLICY IF EXISTS "Authenticated users can view courses" ON course;
CREATE POLICY "Authenticated users can view courses"
    ON course FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can create courses
DROP POLICY IF EXISTS "Admins can create courses" ON course;
CREATE POLICY "Admins can create courses"
    ON course FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can update courses
DROP POLICY IF EXISTS "Admins can update courses" ON course;
CREATE POLICY "Admins can update courses"
    ON course FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can delete courses
DROP POLICY IF EXISTS "Admins can delete courses" ON course;
CREATE POLICY "Admins can delete courses"
    ON course FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==================== SECTION TABLE ====================
ALTER TABLE section ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sections they're enrolled in or all sections if admin
DROP POLICY IF EXISTS "Users can view their sections" ON section;
CREATE POLICY "Users can view their sections"
    ON section FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all sections
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        -- Users can see sections they're enrolled in
        id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only admins and teachers can create sections
DROP POLICY IF EXISTS "Admins and teachers can create sections" ON section;
CREATE POLICY "Admins and teachers can create sections"
    ON section FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Admins and section teachers can update sections
DROP POLICY IF EXISTS "Admins and teachers can update sections" ON section;
CREATE POLICY "Admins and teachers can update sections"
    ON section FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid() AND role = 'teacher'
        )
    );

-- Policy: Only admins can delete sections
DROP POLICY IF EXISTS "Admins can delete sections" ON section;
CREATE POLICY "Admins can delete sections"
    ON section FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==================== PAGE TABLE ====================
ALTER TABLE page ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view pages for sections they're enrolled in
DROP POLICY IF EXISTS "Users can view pages for their sections" ON page;
CREATE POLICY "Users can view pages for their sections"
    ON page FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all pages
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        -- Users can see pages in their sections
        id IN (
            SELECT sp.page_id FROM section_pages sp
            INNER JOIN user_sections us ON sp.section_id = us.section_id
            WHERE us.user_id = auth.uid()
        )
    );

-- Policy: Teachers and admins can create pages
DROP POLICY IF EXISTS "Teachers and admins can create pages" ON page;
CREATE POLICY "Teachers and admins can create pages"
    ON page FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Teachers and admins can update pages
DROP POLICY IF EXISTS "Teachers and admins can update pages" ON page;
CREATE POLICY "Teachers and admins can update pages"
    ON page FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Teachers and admins can delete pages
DROP POLICY IF EXISTS "Teachers and admins can delete pages" ON page;
CREATE POLICY "Teachers and admins can delete pages"
    ON page FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- ==================== BLOCK TABLE ====================
ALTER TABLE block ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view blocks that are in pages they have access to
DROP POLICY IF EXISTS "Users can view blocks in their pages" ON block;
CREATE POLICY "Users can view blocks in their pages"
    ON block FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all blocks
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        -- Users can see blocks in pages they have access to
        id IN (
            SELECT pb.block_id FROM page_blocks pb
            INNER JOIN section_pages sp ON pb.page_id = sp.page_id
            INNER JOIN user_sections us ON sp.section_id = us.section_id
            WHERE us.user_id = auth.uid()
        )
    );

-- Policy: Teachers and admins can create blocks
DROP POLICY IF EXISTS "Teachers and admins can create blocks" ON block;
CREATE POLICY "Teachers and admins can create blocks"
    ON block FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Teachers and admins can update blocks
DROP POLICY IF EXISTS "Teachers and admins can update blocks" ON block;
CREATE POLICY "Teachers and admins can update blocks"
    ON block FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Teachers and admins can delete blocks
DROP POLICY IF EXISTS "Teachers and admins can delete blocks" ON block;
CREATE POLICY "Teachers and admins can delete blocks"
    ON block FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- ==================== PAGE_BLOCKS TABLE ====================
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view page_blocks for pages they have access to
DROP POLICY IF EXISTS "Users can view page_blocks for their pages" ON page_blocks;
CREATE POLICY "Users can view page_blocks for their pages"
    ON page_blocks FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all page_blocks
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        -- Users can see page_blocks for their sections
        page_id IN (
            SELECT sp.page_id FROM section_pages sp
            INNER JOIN user_sections us ON sp.section_id = us.section_id
            WHERE us.user_id = auth.uid()
        )
    );

-- Policy: Teachers and admins can create page_blocks
DROP POLICY IF EXISTS "Teachers and admins can create page_blocks" ON page_blocks;
CREATE POLICY "Teachers and admins can create page_blocks"
    ON page_blocks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Teachers and admins can delete page_blocks
DROP POLICY IF EXISTS "Teachers and admins can delete page_blocks" ON page_blocks;
CREATE POLICY "Teachers and admins can delete page_blocks"
    ON page_blocks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- ==================== SECTION_PAGES TABLE ====================
ALTER TABLE section_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view section_pages for sections they're enrolled in
DROP POLICY IF EXISTS "Users can view section_pages for their sections" ON section_pages;
CREATE POLICY "Users can view section_pages for their sections"
    ON section_pages FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all section_pages
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        -- Users can see section_pages for their sections
        section_id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Teachers and admins can create section_pages
DROP POLICY IF EXISTS "Teachers and admins can create section_pages" ON section_pages;
CREATE POLICY "Teachers and admins can create section_pages"
    ON section_pages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        section_id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid() AND role = 'teacher'
        )
    );

-- Policy: Teachers and admins can delete section_pages
DROP POLICY IF EXISTS "Teachers and admins can delete section_pages" ON section_pages;
CREATE POLICY "Teachers and admins can delete section_pages"
    ON section_pages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR
        section_id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid() AND role = 'teacher'
        )
    );

-- ==================== USER_PROFILES TABLE ====================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Policy: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Teachers can view profiles of users in their sections
DROP POLICY IF EXISTS "Teachers can view their students profiles" ON user_profiles;
CREATE POLICY "Teachers can view their students profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT DISTINCT us.user_id
            FROM user_sections us
            WHERE us.section_id IN (
                SELECT section_id FROM user_sections
                WHERE user_id = auth.uid() AND role IN ('teacher', 'teacher_assistant')
            )
        )
    );

-- Policy: Users can create their own profile
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Policy: Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==================== USER_ROLES TABLE ====================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Admins can view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can create roles
DROP POLICY IF EXISTS "Admins can create roles" ON user_roles;
CREATE POLICY "Admins can create roles"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can delete roles
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
CREATE POLICY "Admins can delete roles"
    ON user_roles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==================== USER_SECTIONS TABLE ====================
ALTER TABLE user_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own section assignments
DROP POLICY IF EXISTS "Users can view their own section assignments" ON user_sections;
CREATE POLICY "Users can view their own section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Admins can view all section assignments
DROP POLICY IF EXISTS "Admins can view all section assignments" ON user_sections;
CREATE POLICY "Admins can view all section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Teachers can view section assignments for their sections
DROP POLICY IF EXISTS "Teachers can view their section assignments" ON user_sections;
CREATE POLICY "Teachers can view their section assignments"
    ON user_sections FOR SELECT
    TO authenticated
    USING (
        section_id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid() AND role IN ('teacher', 'teacher_assistant')
        )
    );

-- Policy: Only admins can create section assignments
DROP POLICY IF EXISTS "Admins can create section assignments" ON user_sections;
CREATE POLICY "Admins can create section assignments"
    ON user_sections FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can delete section assignments
DROP POLICY IF EXISTS "Admins can delete section assignments" ON user_sections;
CREATE POLICY "Admins can delete section assignments"
    ON user_sections FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'RLS policies successfully enabled for all tables!';
END $$;
