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

## Option 3: One-Step SQL (Recommended - Fixes All Issues)

This script will create ALL missing tables (including `user_profiles` and `user_roles` which were missing) and set up all triggers.

1. Open Supabase SQL Editor.
2. Open the file `COMPLETE_DB_INITIALIZATION.sql` from your project root.
3. Copy and paste the entire content into the SQL Editor.
4. Run the query.

This will instantly fix the "Failed to load user data" error and ensure your Notification system works.

