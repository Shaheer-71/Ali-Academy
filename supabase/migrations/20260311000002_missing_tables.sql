-- Migration: Create all tables missing from the backup restore
-- Tables: devices, teacher_subject_enrollments, student_subject_enrollments,
--         class_enrollments, notifications, notification_recipients,
--         fee_structures, student_fees, fee_payments

-- ============================================================
-- DEVICES (push notification tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.devices (
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text,
    ip_address text,
    updated_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_pkey') THEN
    ALTER TABLE public.devices ADD CONSTRAINT devices_pkey PRIMARY KEY (user_id, token);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_user_id_fkey') THEN
    ALTER TABLE public.devices ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- TEACHER SUBJECT ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_subject_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subject_enrollments_pkey') THEN
    ALTER TABLE public.teacher_subject_enrollments ADD CONSTRAINT teacher_subject_enrollments_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subject_enrollments_unique') THEN
    ALTER TABLE public.teacher_subject_enrollments ADD CONSTRAINT teacher_subject_enrollments_unique UNIQUE (teacher_id, class_id, subject_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tse_teacher_id_fkey') THEN
    ALTER TABLE public.teacher_subject_enrollments ADD CONSTRAINT tse_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tse_class_id_fkey') THEN
    ALTER TABLE public.teacher_subject_enrollments ADD CONSTRAINT tse_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tse_subject_id_fkey') THEN
    ALTER TABLE public.teacher_subject_enrollments ADD CONSTRAINT tse_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tse_teacher_id ON public.teacher_subject_enrollments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tse_class_id ON public.teacher_subject_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_tse_is_active ON public.teacher_subject_enrollments(is_active);

-- ============================================================
-- STUDENT SUBJECT ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_subject_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_subject_enrollments_pkey') THEN
    ALTER TABLE public.student_subject_enrollments ADD CONSTRAINT student_subject_enrollments_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sse_unique') THEN
    ALTER TABLE public.student_subject_enrollments ADD CONSTRAINT sse_unique UNIQUE (student_id, class_id, subject_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sse_student_id_fkey') THEN
    ALTER TABLE public.student_subject_enrollments ADD CONSTRAINT sse_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sse_class_id_fkey') THEN
    ALTER TABLE public.student_subject_enrollments ADD CONSTRAINT sse_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sse_subject_id_fkey') THEN
    ALTER TABLE public.student_subject_enrollments ADD CONSTRAINT sse_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sse_student_id ON public.student_subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_sse_class_id ON public.student_subject_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_sse_is_active ON public.student_subject_enrollments(is_active);

-- ============================================================
-- CLASS ENROLLMENTS (for notification targeting by class)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    role text DEFAULT 'student',
    created_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_enrollments_pkey') THEN
    ALTER TABLE public.class_enrollments ADD CONSTRAINT class_enrollments_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_enrollments_unique') THEN
    ALTER TABLE public.class_enrollments ADD CONSTRAINT class_enrollments_unique UNIQUE (user_id, class_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ce_class_id_fkey') THEN
    ALTER TABLE public.class_enrollments ADD CONSTRAINT ce_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ce_class_id ON public.class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_ce_user_id ON public.class_enrollments(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium',
    entity_type text,
    entity_id uuid,
    created_by uuid,
    target_type text NOT NULL,
    target_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_priority_check CHECK (priority = ANY (ARRAY['low', 'medium', 'high'])),
    CONSTRAINT notifications_target_type_check CHECK (target_type = ANY (ARRAY['all_students', 'all_teachers', 'class', 'individual', 'student', 'all']))
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pkey') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON public.notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);

-- ============================================================
-- NOTIFICATION RECIPIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_read boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_recipients_pkey') THEN
    ALTER TABLE public.notification_recipients ADD CONSTRAINT notification_recipients_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr_unique') THEN
    ALTER TABLE public.notification_recipients ADD CONSTRAINT nr_unique UNIQUE (notification_id, user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr_notification_id_fkey') THEN
    ALTER TABLE public.notification_recipients ADD CONSTRAINT nr_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nr_user_id ON public.notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_nr_notification_id ON public.notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_nr_is_read ON public.notification_recipients(is_read);

-- ============================================================
-- FEE STRUCTURES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid,
    class_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    academic_year text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_pkey') THEN
    ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_class_year_key') THEN
    ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_class_year_key UNIQUE (class_id, academic_year);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fs_class_id_fkey') THEN
    ALTER TABLE public.fee_structures ADD CONSTRAINT fs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON public.fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year ON public.fee_structures(academic_year);

-- ============================================================
-- STUDENT FEES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    amount_due numeric(10,2) NOT NULL,
    academic_year text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_fees_pkey') THEN
    ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_fees_unique') THEN
    ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_unique UNIQUE (student_id, class_id, academic_year);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sf_student_id_fkey') THEN
    ALTER TABLE public.student_fees ADD CONSTRAINT sf_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sf_class_id_fkey') THEN
    ALTER TABLE public.student_fees ADD CONSTRAINT sf_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_class_id ON public.student_fees(class_id);

-- ============================================================
-- FEE PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_fee_id uuid,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    amount_paid numeric(10,2),
    payment_status text DEFAULT 'pending' NOT NULL,
    payment_method text,
    payment_date date,
    notes text,
    paid_by uuid,
    receipt_number text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fee_payments_month_check CHECK (month >= 1 AND month <= 12),
    CONSTRAINT fee_payments_status_check CHECK (payment_status = ANY (ARRAY['pending', 'paid', 'partial', 'overdue'])),
    CONSTRAINT fee_payments_method_check CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['cash', 'card', 'transfer', 'cheque']))
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_payments_pkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fee_payments_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_payments_unique') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fee_payments_unique UNIQUE (student_id, class_id, month, year);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_student_id_fkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fp_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_class_id_fkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fp_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_student_fee_id_fkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fp_student_fee_id_fkey FOREIGN KEY (student_fee_id) REFERENCES public.student_fees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_class_id ON public.fee_payments(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_month_year ON public.fee_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON public.fee_payments(payment_status);

-- ============================================================
-- RLS (enable for sensitive tables)
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notification_recipients;
CREATE POLICY "Users can view their own notifications" ON public.notification_recipients
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can insert notification recipients" ON public.notification_recipients;
CREATE POLICY "Authenticated can insert notification recipients" ON public.notification_recipients
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notification read status" ON public.notification_recipients;
CREATE POLICY "Users can update their own notification read status" ON public.notification_recipients
    FOR UPDATE TO authenticated USING (user_id = auth.uid());
