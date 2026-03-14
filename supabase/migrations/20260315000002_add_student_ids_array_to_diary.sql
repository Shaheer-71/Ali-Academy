-- Add student_ids array column to diary_assignments for multi-student support
ALTER TABLE diary_assignments
    ADD COLUMN IF NOT EXISTS student_ids uuid[] DEFAULT '{}';

-- Migrate existing single student_id to the new array column
UPDATE diary_assignments
SET student_ids = ARRAY[student_id]
WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diary_assignments_student_ids
    ON diary_assignments USING gin (student_ids);
