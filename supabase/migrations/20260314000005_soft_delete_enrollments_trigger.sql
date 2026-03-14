-- Extend the student status sync trigger to also soft-delete/restore
-- subject enrollments. Runs as SECURITY DEFINER to bypass RLS.

CREATE OR REPLACE FUNCTION sync_student_status_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_deleted = true OR NEW.student_status = 'inactive' THEN
        -- Disable login
        UPDATE profiles SET is_active = false WHERE email = NEW.email;
        -- Soft-disable all subject enrollments
        UPDATE student_subject_enrollments SET is_active = false WHERE student_id = NEW.id;

    ELSIF NEW.is_deleted = false AND (NEW.student_status = 'active' OR NEW.student_status IS NULL) THEN
        -- Restore login
        UPDATE profiles SET is_active = true WHERE email = NEW.email;
        -- Restore all subject enrollments
        UPDATE student_subject_enrollments SET is_active = true WHERE student_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
