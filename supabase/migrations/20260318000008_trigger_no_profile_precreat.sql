-- Updated handle_new_user() trigger:
-- No longer does ON CONFLICT update of profiles.id (which caused silent FK violations).
-- Instead, we never pre-create the profile — the trigger always inserts fresh with auth.uid().
-- It also syncs students.id → auth.uid() (SECURITY DEFINER bypasses RLS).
-- ON UPDATE CASCADE on all student FKs propagates the new ID everywhere.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Look up the pre-created student record by email to get full_name and role metadata
  SELECT full_name INTO v_student
  FROM public.students
  WHERE email = NEW.email AND is_deleted = false
  LIMIT 1;

  -- Insert fresh profile with auth.uid() as id — no conflict expected since we no longer pre-create profiles
  INSERT INTO public.profiles (id, email, full_name, role, contact_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_student.full_name, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'contact_number'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Sync students.id → auth.uid() so auth.uid = profiles.id = students.id
  -- ON UPDATE CASCADE propagates to fee_payments, attendance, enrollments, quiz_results, etc.
  UPDATE public.students
  SET id = NEW.id
  WHERE email = NEW.email
    AND is_deleted = false
    AND id != NEW.id;

  RETURN NEW;
END;
$$;
