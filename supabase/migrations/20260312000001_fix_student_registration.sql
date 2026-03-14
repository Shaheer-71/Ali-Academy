-- Fix student registration flow:
-- 1. Add unique constraint on profiles.email (needed for ON CONFLICT)
-- 2. Modify auth trigger to upsert on email so pre-created student profiles get
--    their id updated to the real auth UUID instead of creating a duplicate

-- Step 1: Add unique constraint on profiles.email (safe - emails should already be unique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_unique'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- Step 2: Replace handle_new_user() trigger to use upsert on email.
-- When teacher pre-creates a student profile (with student UUID T),
-- and student later signs up (gets auth UUID A), this trigger updates
-- profiles.id from T -> A instead of inserting a duplicate row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, contact_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'contact_number'
  )
  ON CONFLICT (email) DO UPDATE SET
    id           = EXCLUDED.id,
    full_name    = CASE
                     WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = ''
                     THEN EXCLUDED.full_name
                     ELSE public.profiles.full_name
                   END,
    role         = CASE
                     WHEN public.profiles.role IS NULL
                     THEN EXCLUDED.role
                     ELSE public.profiles.role
                   END;
  RETURN NEW;
END;
$$;
