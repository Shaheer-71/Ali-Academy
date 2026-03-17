-- Fix: replace full-table unique constraint with partial unique index (active rows only).

-- Step 1: drop the old blanket unique constraint first (it's DEFERRABLE so must go before DML)
ALTER TABLE public.timetable DROP CONSTRAINT IF EXISTS unique_class_schedule;

-- Step 2: soft-delete all but one row per (class_id, day, start_time, end_time) group
WITH dupes AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY class_id, day, start_time, end_time
               ORDER BY created_at
           ) AS rn
    FROM timetable
    WHERE deleted_at IS NULL
)
UPDATE timetable
SET deleted_at = NOW()
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- Step 3: partial unique index — only active (non-deleted) rows must be unique
CREATE UNIQUE INDEX IF NOT EXISTS unique_class_schedule_active
    ON public.timetable (class_id, day, start_time, end_time)
    WHERE deleted_at IS NULL;
