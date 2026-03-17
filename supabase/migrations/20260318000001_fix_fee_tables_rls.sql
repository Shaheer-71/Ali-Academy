-- Fix RLS policies for fee_payments, fee_structures, student_fees
-- Teachers/superadmins need full access; students need read-only on their own records

-- ============================================================
-- FEE PAYMENTS
-- ============================================================
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "teachers_manage_fee_payments" ON public.fee_payments;
DROP POLICY IF EXISTS "students_view_fee_payments" ON public.fee_payments;

-- Teachers and superadmins can do everything
CREATE POLICY "teachers_manage_fee_payments"
ON public.fee_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
);

-- Students can view fee payments linked to their student record (via email bridge)
CREATE POLICY "students_view_fee_payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    INNER JOIN public.profiles p ON p.email = s.email
    WHERE p.id = auth.uid()
  )
);

-- ============================================================
-- FEE STRUCTURES
-- ============================================================
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_manage_fee_structures" ON public.fee_structures;
DROP POLICY IF EXISTS "all_users_view_fee_structures" ON public.fee_structures;

CREATE POLICY "teachers_manage_fee_structures"
ON public.fee_structures
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
);

-- All authenticated users can read fee structures (students need it for their fee display)
CREATE POLICY "all_users_view_fee_structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- STUDENT FEES
-- ============================================================
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_manage_student_fees" ON public.student_fees;
DROP POLICY IF EXISTS "students_view_own_student_fees" ON public.student_fees;

CREATE POLICY "teachers_manage_student_fees"
ON public.student_fees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
);

-- Students can read their own student_fees record
CREATE POLICY "students_view_own_student_fees"
ON public.student_fees
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    INNER JOIN public.profiles p ON p.email = s.email
    WHERE p.id = auth.uid()
  )
);
