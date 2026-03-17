-- Simplify handle_new_user() trigger.
-- students.id is now set correctly at creation time (same as profiles.id).
-- Edge Function creates auth user with the exact same UUID via Admin API.
-- So the trigger only needs to handle the profile — no students.id sync needed.

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
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
