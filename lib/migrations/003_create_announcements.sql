-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES section(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcement_reads table (track which users have read announcements)
CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_section_id ON announcements(section_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);

-- Add trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view announcements for sections they're enrolled in
DROP POLICY IF EXISTS "Users can view announcements for their sections" ON announcements;
CREATE POLICY "Users can view announcements for their sections"
    ON announcements FOR SELECT
    USING (
        section_id IN (
            SELECT section_id FROM user_sections WHERE user_id = auth.uid()
        )
    );

-- Policy: Teachers can create announcements for their sections
DROP POLICY IF EXISTS "Teachers can create announcements for their sections" ON announcements;
CREATE POLICY "Teachers can create announcements for their sections"
    ON announcements FOR INSERT
    WITH CHECK (
        section_id IN (
            SELECT section_id FROM user_sections
            WHERE user_id = auth.uid() AND role IN ('teacher', 'teacher_assistant')
        )
    );

-- Policy: Authors can update their own announcements
DROP POLICY IF EXISTS "Authors can update their own announcements" ON announcements;
CREATE POLICY "Authors can update their own announcements"
    ON announcements FOR UPDATE
    USING (author_id = auth.uid());

-- Policy: Authors can delete their own announcements
DROP POLICY IF EXISTS "Authors can delete their own announcements" ON announcements;
CREATE POLICY "Authors can delete their own announcements"
    ON announcements FOR DELETE
    USING (author_id = auth.uid());

-- Policy: Users can view their own reads
DROP POLICY IF EXISTS "Users can view their own announcement reads" ON announcement_reads;
CREATE POLICY "Users can view their own announcement reads"
    ON announcement_reads FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can mark announcements as read
DROP POLICY IF EXISTS "Users can mark announcements as read" ON announcement_reads;
CREATE POLICY "Users can mark announcements as read"
    ON announcement_reads FOR INSERT
    WITH CHECK (user_id = auth.uid());