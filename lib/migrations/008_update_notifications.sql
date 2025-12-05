-- Update notifications table to support different notification types
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_section_id UUID REFERENCES section(id) ON DELETE CASCADE;

-- Create index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_user ON notifications(related_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_section ON notifications(related_section_id);

-- Add comment for clarity
COMMENT ON COLUMN notifications.notification_type IS 'Types: login, course_assigned, student_assigned, general';
