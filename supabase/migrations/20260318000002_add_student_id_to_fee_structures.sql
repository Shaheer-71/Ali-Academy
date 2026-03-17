-- Add student_id to fee_structures for per-student fee amounts

ALTER TABLE public.fee_structures
    ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;

-- Drop the old class+year unique constraint (was class-level only)
ALTER TABLE public.fee_structures
    DROP CONSTRAINT IF EXISTS fee_structures_class_year_key;

-- New unique constraint: one fee per student per class per year
-- PostgreSQL allows multiple NULLs in a UNIQUE constraint, so legacy class-level
-- rows (student_id IS NULL) are still valid.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_student_class_year_key'
  ) THEN
    ALTER TABLE public.fee_structures
      ADD CONSTRAINT fee_structures_student_class_year_key
      UNIQUE (student_id, class_id, academic_year);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fee_structures_student_id ON public.fee_structures(student_id);

-- Update the student SELECT policy to only allow students to see their own fee structure
DROP POLICY IF EXISTS "all_users_view_fee_structures" ON public.fee_structures;

CREATE POLICY "users_view_fee_structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (
  -- Teachers/admins see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  -- Students see only their own fee structure (via email bridge)
  student_id IN (
    SELECT s.id FROM public.students s
    INNER JOIN public.profiles p ON p.email = s.email
    WHERE p.id = auth.uid()
  )
);
