-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, assignment_id, problem_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submissions_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_course ON assignment_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(course_id, assignment_id);

-- Enable RLS
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
    ON assignment_submissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
    ON assignment_submissions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own submissions
CREATE POLICY "Users can update own submissions"
    ON assignment_submissions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Teachers can view all submissions for their courses
CREATE POLICY "Teachers can view course submissions"
    ON assignment_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_sections us
            INNER JOIN section s ON us.section_id = s.id
            WHERE us.user_id = auth.uid()
            AND us.role = 'teacher'
            AND s.course_id::text = assignment_submissions.course_id::text
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER assignment_submission_updated_at
    BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_submission_updated_at();
