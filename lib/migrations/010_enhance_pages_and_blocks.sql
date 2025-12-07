-- Migration 010: Enhance pages and blocks for course assignment and ordering

-- Add columns to page table
ALTER TABLE page
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add order_index to page_blocks for block ordering within a page
ALTER TABLE page_blocks
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add order_index to block table for global ordering (if needed)
ALTER TABLE block
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index on course_id for faster queries
CREATE INDEX IF NOT EXISTS idx_page_course_id ON page(course_id);

-- Create index on order_index for sorted queries
CREATE INDEX IF NOT EXISTS idx_page_order_index ON page(order_index);
CREATE INDEX IF NOT EXISTS idx_page_blocks_order_index ON page_blocks(order_index);

-- Add constraint to ensure order_index is not negative
ALTER TABLE page
ADD CONSTRAINT page_order_index_non_negative CHECK (order_index >= 0);

ALTER TABLE page_blocks
ADD CONSTRAINT page_blocks_order_index_non_negative CHECK (order_index >= 0);

-- Note: We're keeping section_pages table for future use
-- but pages will now primarily link to courses via course_id
-- section_pages can be used if specific sections need custom page assignments
