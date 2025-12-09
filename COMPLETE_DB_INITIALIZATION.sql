-- ==============================================================================
-- COMPLETE INITIALIZATION SCRIPT
-- Run this in Supabase SQL Editor to fix "Failed to load user data" errors
-- This script safely creates all tables, functions, and triggers if they don't exist
-- ==============================================================================

-- 1. SETUP EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE TYPE DEFINITIONS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'teacher_assistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE CORE TABLES
-- Course related
CREATE TABLE IF NOT EXISTS course (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS block (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    content VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Junction tables
CREATE TABLE IF NOT EXISTS page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES page(id) ON DELETE CASCADE,
    block_id UUID REFERENCES block(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_id, block_id)
);

CREATE TABLE IF NOT EXISTS section_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES section(id) ON DELETE CASCADE,
    page_id UUID REFERENCES page(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, page_id)
);

-- 4. CREATE USER MANAGEMENT TABLES
-- This was the MISSING PART causing the error
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    username VARCHAR(100), -- Added from 007 migration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS user_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    section_id UUID REFERENCES section(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, section_id, role)
);

CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES course(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, role)
);

-- 5. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    notification_type VARCHAR(50) DEFAULT 'general',
    related_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    related_section_id UUID REFERENCES section(id) ON DELETE CASCADE,
    related_course_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Idempotent creation)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
    CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can view their own course assignments" ON user_courses;
    CREATE POLICY "Users can view their own course assignments" ON user_courses FOR SELECT USING (user_id = auth.uid());

    -- Public read access for profiles (needed for admin implementation usually, or admin bypasses RLS)
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
    CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
END $$;

-- 7. ADMIN NOTIFICATION LOGIC
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
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
EXCEPTION WHEN OTHERS THEN RETURN NEW; -- Prevent login blocking
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_admin_user_login()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
    last_notification TIMESTAMP;
BEGIN
    IF (NEW.last_sign_in_at IS NOT NULL) AND (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN
        SELECT id INTO admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
        
        -- Check spam prevention (once per 24h)
        SELECT created_at INTO last_notification FROM notifications
        WHERE user_id = admin_id AND notification_type = 'user_login' AND related_user_id = NEW.id
        AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC LIMIT 1;

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
EXCEPTION WHEN OTHERS THEN RETURN NEW; -- Prevent login blocking
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGERS
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON auth.users;
CREATE TRIGGER trigger_notify_admin_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION notify_admin_new_user();

DROP TRIGGER IF EXISTS trigger_notify_admin_user_login ON auth.users;
CREATE TRIGGER trigger_notify_admin_user_login AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION notify_admin_user_login();

-- Automatic updated_at triggers for all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('course', 'block', 'page', 'section', 'user_profiles')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ==============================================================================
-- SUCCESS: Database Schema is Complete
-- ==============================================================================
