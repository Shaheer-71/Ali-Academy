-- Trigger: whenever a student row is updated, automatically sync
-- is_active on the matching profile. Runs as SECURITY DEFINER so it
-- bypasses RLS (the app's anon/teacher key cannot update other users' profiles).

CREATE OR REPLACE FUNCTION sync_student_status_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_deleted = true OR NEW.student_status = 'inactive' THEN
        UPDATE profiles SET is_active = false WHERE email = NEW.email;
    ELSIF NEW.is_deleted = false AND (NEW.student_status = 'active' OR NEW.student_status IS NULL) THEN
        UPDATE profiles SET is_active = true WHERE email = NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_student_status ON students;

CREATE TRIGGER trg_sync_student_status
AFTER UPDATE ON students
FOR EACH ROW
WHEN (
    OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR
    OLD.student_status IS DISTINCT FROM NEW.student_status
)
EXECUTE FUNCTION sync_student_status_to_profile();
