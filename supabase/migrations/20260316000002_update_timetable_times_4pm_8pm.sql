-- Update all existing timetable entries to have times between 4:00 PM and 8:00 PM.
-- Uses session_replication_role = replica to bypass user-defined conflict triggers.

SET session_replication_role = 'replica';

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY day, class_id ORDER BY start_time, id) AS rn
    FROM timetable
    WHERE deleted_at IS NULL
)
UPDATE timetable t
SET
    start_time = CASE ranked.rn
        WHEN 1 THEN '16:00:00'::time
        WHEN 2 THEN '17:00:00'::time
        WHEN 3 THEN '18:00:00'::time
        ELSE         '19:00:00'::time
    END,
    end_time = CASE ranked.rn
        WHEN 1 THEN '17:00:00'::time
        WHEN 2 THEN '18:00:00'::time
        WHEN 3 THEN '19:00:00'::time
        ELSE         '20:00:00'::time
    END
FROM ranked
WHERE t.id = ranked.id;

RESET session_replication_role;
