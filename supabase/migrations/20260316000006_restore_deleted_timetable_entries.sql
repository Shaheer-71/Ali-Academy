-- Restore all timetable entries incorrectly soft-deleted by migration 20260316000005.

-- Step 1: drop the partial unique index first so restore doesn't violate it
DROP INDEX IF EXISTS unique_class_schedule_active;

-- Step 2: restore all soft-deleted entries (bypass conflict trigger)
SET session_replication_role = 'replica';
UPDATE timetable SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
RESET session_replication_role;
