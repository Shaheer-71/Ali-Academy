-- Fix student RLS policies to use auth.users.email instead of profiles.id
-- profiles.id may be the pre-created students UUID, not the real auth UUID,
-- so auth.uid() != profiles.id for registered students.
-- Going directly through auth.users is always reliable.

-- ============================================================
-- FEE PAYMENTS — fix student SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "students_view_fee_payments" ON public.fee_payments;

CREATE POLICY "students_view_fee_payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  -- Teachers/admins bypass (already covered by teachers_manage policy, but be safe)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  -- Students: match via auth email → students table
  student_id IN (
    SELECT id FROM public.students
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
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
  -- Teachers/admins see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'superadmin', 'admin')
  )
  OR
  -- Students see only their own fee structure
  student_id IN (
    SELECT id FROM public.students
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
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
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
