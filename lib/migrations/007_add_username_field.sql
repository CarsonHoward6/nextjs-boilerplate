-- Add username field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Update existing records to have username from email (remove after initial migration)
UPDATE user_profiles
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;
