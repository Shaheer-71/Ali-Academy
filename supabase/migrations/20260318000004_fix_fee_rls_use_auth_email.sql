-- Fix fee RLS policies to use auth.email() instead of querying auth.users directly.
-- The authenticated role does NOT have SELECT on auth.users, so
-- (SELECT email FROM auth.users WHERE id = auth.uid()) raises 42501.
-- auth.email() is a Supabase built-in that returns the same value safely.

-- ============================================================
-- FEE PAYMENTS — fix student SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "students_view_fee_payments" ON public.fee_payments;

CREATE POLICY "students_view_fee_payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  student_id IN (
    SELECT id FROM public.students
    WHERE email = auth.email()
  )
);

-- ============================================================
-- FEE STRUCTURES — fix student SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "users_view_fee_structures" ON public.fee_structures;

CREATE POLICY "users_view_fee_structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  student_id IN (
    SELECT id FROM public.students
    WHERE email = auth.email()
  )
);

-- ============================================================
-- STUDENT FEES — fix student SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "students_view_own_student_fees" ON public.student_fees;

CREATE POLICY "students_view_own_student_fees"
ON public.student_fees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  student_id IN (
    SELECT id FROM public.students
    WHERE email = auth.email()
  )
);
