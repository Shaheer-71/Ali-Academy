-- Fix: soft-deleting a timetable entry (setting deleted_at) fires the overlap trigger
-- which raises a false conflict because the row's own times are still present.
-- Add an early exit when the update is a soft-delete.

CREATE OR REPLACE FUNCTION public.check_timetable_overlaps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Skip conflict check when soft-deleting or when the row is already deleted
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE class_id = NEW.class_id AND day = NEW.day AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
            (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
            (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Class scheduling conflict: This class already has a lesson during this time on %', NEW.day;
    END IF;

    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE teacher_id = NEW.teacher_id AND day = NEW.day AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
            (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
            (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Teacher scheduling conflict: This teacher is already assigned to another class during this time on %', NEW.day;
    END IF;

    RETURN NEW;
END;
$$;
