-- Add ON UPDATE CASCADE to all FK constraints referencing students.id
-- so that when students.id is synced to auth.uid() during registration,
-- all related rows (attendance, diary, fee, enrollments, quiz) cascade automatically.

-- ── attendance ─────────────────────────────────────────────────────────────
ALTER TABLE public.attendance
    DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── diary_assignments ───────────────────────────────────────────────────────
ALTER TABLE public.diary_assignments
    DROP CONSTRAINT IF EXISTS diary_assignments_student_id_fkey;
ALTER TABLE public.diary_assignments
    ADD CONSTRAINT diary_assignments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── quiz_results ────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_results
    DROP CONSTRAINT IF EXISTS quiz_results_student_id_fkey;
ALTER TABLE public.quiz_results
    ADD CONSTRAINT quiz_results_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── student_subject_enrollments ─────────────────────────────────────────────
ALTER TABLE public.student_subject_enrollments
    DROP CONSTRAINT IF EXISTS sse_student_id_fkey;
ALTER TABLE public.student_subject_enrollments
    ADD CONSTRAINT sse_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── student_fees ────────────────────────────────────────────────────────────
ALTER TABLE public.student_fees
    DROP CONSTRAINT IF EXISTS sf_student_id_fkey;
ALTER TABLE public.student_fees
    ADD CONSTRAINT sf_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── fee_payments ────────────────────────────────────────────────────────────
ALTER TABLE public.fee_payments
    DROP CONSTRAINT IF EXISTS fp_student_id_fkey;
ALTER TABLE public.fee_payments
    ADD CONSTRAINT fp_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── fee_structures ──────────────────────────────────────────────────────────
ALTER TABLE public.fee_structures
    DROP CONSTRAINT IF EXISTS fee_structures_student_id_fkey;
ALTER TABLE public.fee_structures
    ADD CONSTRAINT fee_structures_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id)
    ON DELETE CASCADE ON UPDATE CASCADE;
