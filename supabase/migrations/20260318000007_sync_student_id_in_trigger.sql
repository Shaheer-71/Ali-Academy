-- Update handle_new_user() trigger to also sync students.id = auth.uid()
-- when a student completes registration.
-- Runs as SECURITY DEFINER so it bypasses RLS (student role can't update students.id directly).
-- Combined with ON UPDATE CASCADE on all student FKs, this keeps
-- auth.uid(), profiles.id, and students.id identical from registration onward.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert profile: update id to auth.uid() if email already exists (pre-created student profile)
  INSERT INTO public.profiles (id, email, full_name, role, contact_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'contact_number'
  )
  ON CONFLICT (email) DO UPDATE SET
    id        = EXCLUDED.id,
    full_name = CASE
                  WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = ''
                  THEN EXCLUDED.full_name
                  ELSE public.profiles.full_name
                END,
    role      = CASE
                  WHEN public.profiles.role IS NULL
                  THEN EXCLUDED.role
                  ELSE public.profiles.role
                END;

  -- Sync students.id → auth.uid() so all three (auth, profiles, students) share the same UUID.
  -- ON UPDATE CASCADE propagates this to fee_payments, attendance, enrollments, etc.
  UPDATE public.students
  SET id = NEW.id
  WHERE email = NEW.email
    AND is_deleted = false
    AND id != NEW.id;

  RETURN NEW;
END;
$$;
