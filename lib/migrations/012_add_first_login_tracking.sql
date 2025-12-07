-- Migration 012: Add first login tracking to user_profiles

-- Add first_login_at and last_login_at columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index on first_login_at for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_first_login_at ON user_profiles(first_login_at);

-- Create index on last_login_at for activity tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login_at ON user_profiles(last_login_at);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.first_login_at IS 'Timestamp of user''s first successful login';
COMMENT ON COLUMN user_profiles.last_login_at IS 'Timestamp of user''s most recent login';
