-- ============================================
-- Migration 016: Add related_course_id to notifications
-- This adds the missing column for course assignment notifications
-- ============================================

-- Add related_course_id column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Create index for faster lookups by course
CREATE INDEX IF NOT EXISTS idx_notifications_related_course_id
ON notifications(related_course_id);

-- ============================================
-- Migration Complete
-- This allows course assignment notifications to reference courses
-- Run this in Supabase SQL Editor
-- ============================================
