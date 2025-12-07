-- ============================================
-- SUPABASE QUICK FIX - Run this in Supabase SQL Editor
-- This will create all necessary tables and triggers
-- ============================================

-- 1. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional columns
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_section_id UUID REFERENCES section(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_course_id UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_user ON notifications(related_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_section ON notifications(related_section_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- 2. CREATE USER_COURSES TABLE
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

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own course assignments" ON user_courses;
CREATE POLICY "Users can view their own course assignments"
    ON user_courses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

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

-- 3. CREATE ADMIN NOTIFICATION FUNCTIONS
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
BEGIN
    -- Find the admin user ID
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    -- If admin exists, create notification
    IF admin_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, notification_type, related_user_id)
        VALUES (
            admin_id,
            'user_created',
            'New User Registered',
            'New user registered: ' || COALESCE(NEW.email, 'Unknown email'),
            'user_created',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_admin_user_login()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
    last_notification TIMESTAMP;
BEGIN
    -- Only trigger if last_sign_in_at changed (user logged in)
    IF (NEW.last_sign_in_at IS NOT NULL) AND
       (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN

        -- Find the admin user ID
        SELECT id INTO admin_id
        FROM auth.users
        WHERE email = admin_email
        LIMIT 1;

        -- Check if we already notified about this user today
        SELECT created_at INTO last_notification
        FROM notifications
        WHERE user_id = admin_id
          AND notification_type = 'user_login'
          AND related_user_id = NEW.id
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 1;

        -- If admin exists and we haven't notified in the last 24 hours, create notification
        IF admin_id IS NOT NULL AND last_notification IS NULL THEN
            INSERT INTO notifications (user_id, type, title, message, notification_type, related_user_id)
            VALUES (
                admin_id,
                'user_login',
                'User Login',
                'User logged in: ' || COALESCE(NEW.email, 'Unknown email'),
                'user_login',
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE TRIGGERS
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON auth.users;
CREATE TRIGGER trigger_notify_admin_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_user();

DROP TRIGGER IF EXISTS trigger_notify_admin_user_login ON auth.users;
CREATE TRIGGER trigger_notify_admin_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_user_login();

-- ============================================
-- SUCCESS! You can now login and create users
-- ============================================
