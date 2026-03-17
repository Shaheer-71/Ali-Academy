-- Fix teacher scheduling conflicts.
-- Previous migration partitioned by (day, class_id) — caused same teacher to appear
-- in multiple classes at the same time.
-- This migration partitions by (day, teacher_id) so each teacher gets sequential
-- non-overlapping 30-minute slots (16:00–20:00 = 8 slots per teacher per day).

SET session_replication_role = 'replica';

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY day, teacher_id
            ORDER BY class_id, subject_id, id
        ) AS rn
    FROM timetable
    WHERE deleted_at IS NULL
)
UPDATE timetable t
SET
    start_time = CASE ranked.rn
        WHEN 1 THEN '16:00:00'::time
        WHEN 2 THEN '16:30:00'::time
        WHEN 3 THEN '17:00:00'::time
        WHEN 4 THEN '17:30:00'::time
        WHEN 5 THEN '18:00:00'::time
        WHEN 6 THEN '18:30:00'::time
        WHEN 7 THEN '19:00:00'::time
        ELSE         '19:30:00'::time
    END,
    end_time = CASE ranked.rn
        WHEN 1 THEN '16:30:00'::time
        WHEN 2 THEN '17:00:00'::time
        WHEN 3 THEN '17:30:00'::time
        WHEN 4 THEN '18:00:00'::time
        WHEN 5 THEN '18:30:00'::time
        WHEN 6 THEN '19:00:00'::time
        WHEN 7 THEN '19:30:00'::time
        ELSE         '20:00:00'::time
    END
FROM ranked
WHERE t.id = ranked.id;

RESET session_replication_role;
