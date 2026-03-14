-- Add soft delete support to diary_assignments
ALTER TABLE diary_assignments
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_diary_assignments_is_deleted
    ON diary_assignments (is_deleted);
