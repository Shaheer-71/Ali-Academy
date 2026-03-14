-- Add subject_id to diary_assignments table
ALTER TABLE diary_assignments
    ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_diary_assignments_subject_id ON diary_assignments(subject_id);
