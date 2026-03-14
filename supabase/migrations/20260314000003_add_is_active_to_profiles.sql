-- Add is_active column to profiles table
-- Used for account activation/deactivation without deleting the row
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Mark any profiles whose email matches a deactivated student as inactive
UPDATE profiles
SET is_active = false
WHERE email IN (
    SELECT email FROM students WHERE is_deleted = true OR student_status = 'inactive'
);
