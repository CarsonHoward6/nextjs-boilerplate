# Manual Migration Instructions for Supabase

The error you're seeing is because the database triggers and tables don't exist on your Supabase instance yet. Here's how to fix it:

## Option 1: Run SQL Directly in Supabase (Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run these migrations in order:**

### Step 1: Run 004_create_notifications.sql
```sql
-- Copy and paste the contents of lib/migrations/004_create_notifications.sql
```

### Step 2: Run 008_update_notifications.sql
```sql
-- Copy and paste the contents of lib/migrations/008_update_notifications.sql
```

### Step 3: Run 013_create_user_courses.sql
```sql
-- Copy and paste the contents of lib/migrations/013_create_user_courses.sql
```

### Step 4: Run 014_admin_user_notifications.sql
```sql
-- Copy and paste the contents of lib/migrations/014_admin_user_notifications.sql
```

## Option 2: Quick Fix - Disable the Triggers Temporarily

If you want to login immediately and set up migrations later:

1. Go to Supabase SQL Editor
2. Run this to disable the triggers:

```sql
-- Drop the triggers temporarily
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON auth.users;
DROP TRIGGER IF EXISTS trigger_notify_admin_user_login ON auth.users;

-- Drop the functions
DROP FUNCTION IF EXISTS notify_admin_new_user();
DROP FUNCTION IF EXISTS notify_admin_user_login();
```

3. You can login now
4. Later, run the full migrations to restore notifications

## Option 3: One-Step SQL (All Required Tables and Triggers)

Run this complete SQL in Supabase SQL Editor:

```sql
-- 1. Create notifications table
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

-- Add new columns
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

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- 2. Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES course(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- User courses policies
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

-- 3. Create admin notification triggers
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
BEGIN
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
        VALUES (
            admin_id,
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
    IF (NEW.last_sign_in_at IS NOT NULL) AND
       (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN

        SELECT id INTO admin_id
        FROM auth.users
        WHERE email = admin_email
        LIMIT 1;

        SELECT created_at INTO last_notification
        FROM notifications
        WHERE user_id = admin_id
          AND notification_type = 'user_login'
          AND related_user_id = NEW.id
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 1;

        IF admin_id IS NOT NULL AND last_notification IS NULL THEN
            INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
            VALUES (
                admin_id,
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

-- Create triggers
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
```

## After Running Migrations

Try logging in again at: http://localhost:3001/login

The login should now work!
