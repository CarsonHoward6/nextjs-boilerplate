-- Migration 011: Update assignment_submissions to use UUIDs

-- Drop the existing table and recreate with proper UUID references
-- Save existing data first if any exists
CREATE TABLE IF NOT EXISTS assignment_submissions_backup AS
SELECT * FROM assignment_submissions;

-- Drop old table
DROP TABLE IF EXISTS assignment_submissions;

-- Create new table with UUID references
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES course(id) ON DELETE CASCADE,
    page_id UUID REFERENCES page(id) ON DELETE CASCADE,
    block_id UUID REFERENCES block(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    grade NUMERIC(5,2),  -- Add grade field (0-100)
    feedback TEXT,       -- Add feedback field for teachers
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    UNIQUE(user_id, course_id, page_id, block_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_course_id ON assignment_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_page_id ON assignment_submissions(page_id);
CREATE INDEX IF NOT EXISTS idx_submissions_block_id ON assignment_submissions(block_id);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON assignment_submissions(graded_by);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Manual data migration required if assignment_submissions_backup has data
-- The integer IDs from old submissions cannot be automatically mapped to UUIDs
