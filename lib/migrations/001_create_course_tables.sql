-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create block table
CREATE TABLE IF NOT EXISTS block (
                                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    content VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
-- Create course table
CREATE TABLE IF NOT EXISTS course (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
-- Create page table
CREATE TABLE IF NOT EXISTS page (
                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
-- Create section table
CREATE TABLE IF NOT EXISTS section (
                                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES course(id) ON DELETE SET NULL,
    title VARCHAR(50),
    year INTEGER,
    semester VARCHAR(20),
    term VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
-- Create junction table for page-block many-to-many relationship
CREATE TABLE IF NOT EXISTS page_blocks (
                                           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES page(id) ON DELETE CASCADE,
    block_id UUID REFERENCES block(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_id, block_id)
    );
-- Create junction table for section-page many-to-many relationship
CREATE TABLE IF NOT EXISTS section_pages (
                                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES section(id) ON DELETE CASCADE,
    page_id UUID REFERENCES page(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, page_id)
    );
-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_section_course_id ON section(course_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page_id ON page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_block_id ON page_blocks(block_id);
CREATE INDEX IF NOT EXISTS idx_section_pages_section_id ON section_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_section_pages_page_id ON section_pages(page_id);
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Add triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_block_updated_at ON block;
CREATE TRIGGER update_block_updated_at BEFORE UPDATE ON block
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_updated_at ON course;
CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON course
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page_updated_at ON page;
CREATE TRIGGER update_page_updated_at BEFORE UPDATE ON page
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_section_updated_at ON section;
CREATE TRIGGER update_section_updated_at BEFORE UPDATE ON section
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();