-- ============================================
-- EMERGENCY FIX - Run this FIRST in Supabase SQL Editor
-- This temporarily disables the problematic triggers
-- ============================================

-- Step 1: Drop the triggers that are causing login errors
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON auth.users;
DROP TRIGGER IF EXISTS trigger_notify_admin_user_login ON auth.users;

-- Step 2: Drop the functions
DROP FUNCTION IF EXISTS notify_admin_new_user();
DROP FUNCTION IF EXISTS notify_admin_user_login();

-- ============================================
-- NOW YOU CAN LOGIN!
-- After this, run FULL_SETUP.sql to restore features
-- ============================================
