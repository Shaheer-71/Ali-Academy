-- Migration: Add superadmin role and set Rafeh as superadmin

-- 1. Drop existing role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Re-add with superadmin included
ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('teacher', 'student', 'parent', 'superadmin'));

-- 3. Set Rafeh as superadmin
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'rafeh@aliacademy.edu';
