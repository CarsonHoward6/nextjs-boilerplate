-- Create user_courses table for course-level assignments (without specific sections)
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES course(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, role)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);

-- Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own course assignments
DROP POLICY IF EXISTS "Users can view their own course assignments" ON user_courses;
CREATE POLICY "Users can view their own course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Admins can view all course assignments
DROP POLICY IF EXISTS "Admins can view all course assignments" ON user_courses;
CREATE POLICY "Admins can view all course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can create course assignments
DROP POLICY IF EXISTS "Admins can create course assignments" ON user_courses;
CREATE POLICY "Admins can create course assignments"
    ON user_courses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can delete course assignments
DROP POLICY IF EXISTS "Admins can delete course assignments" ON user_courses;
CREATE POLICY "Admins can delete course assignments"
    ON user_courses FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
