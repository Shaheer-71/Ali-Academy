-- Restore missing schema from Ali-Academy backup to Ali-Academy-1.0
-- This migration adds all tables, functions, indexes, triggers, and RLS policies
-- that were not captured in the original 6 migrations.

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- lectures: missing file_name, file_size, subject_id, is_active, updated_at
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS file_name character varying(255);
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS subject_id uuid;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS youtube_link text;

-- Fix lectures.file_url type if needed
ALTER TABLE public.lectures ALTER COLUMN file_url TYPE character varying(500);
ALTER TABLE public.lectures ALTER COLUMN title TYPE character varying(255);
ALTER TABLE public.lectures ALTER COLUMN file_type TYPE character varying(100);

-- students: missing many columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS deleted_by uuid;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_status text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_date date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS medical_conditions text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS has_registered boolean NOT NULL DEFAULT false;

-- students: add gender constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_gender_check') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])));
  END IF;
END $$;

-- profiles: missing parent_phone, role constraint fix
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_phone numeric;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['teacher'::text, 'student'::text, 'parent'::text])));
  END IF;
END $$;

-- ============================================================
-- FUNCTIONS (non-table-dependent)
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_grade(percentage numeric) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF percentage IS NULL THEN RETURN NULL;
  ELSIF percentage >= 90 THEN RETURN 'A+';
  ELSIF percentage >= 80 THEN RETURN 'A';
  ELSIF percentage >= 70 THEN RETURN 'B+';
  ELSIF percentage >= 60 THEN RETURN 'B';
  ELSIF percentage >= 50 THEN RETURN 'C+';
  ELSIF percentage >= 40 THEN RETURN 'C';
  ELSE RETURN 'F';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_percentage(p_student_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_days integer;
  present_days integer;
BEGIN
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('present', 'late')) as present
  INTO total_days, present_days
  FROM attendance
  WHERE student_id = p_student_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);

  IF total_days = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((present_days::decimal / total_days::decimal) * 100, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 'student');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_attendance_session_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_class_id uuid;
  target_date date;
  target_posted_by uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_class_id := OLD.class_id;
    target_date := OLD.date;
    target_posted_by := OLD.marked_by;
  ELSE
    target_class_id := NEW.class_id;
    target_date := NEW.date;
    target_posted_by := NEW.marked_by;
  END IF;

  INSERT INTO attendance_sessions (
    class_id, date, posted_by,
    total_students, present_count, late_count, absent_count
  )
  SELECT
    target_class_id, target_date, target_posted_by,
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count
  FROM attendance
  WHERE class_id = target_class_id AND date = target_date
  ON CONFLICT (class_id, date)
  DO UPDATE SET
    total_students = EXCLUDED.total_students,
    present_count = EXCLUDED.present_count,
    late_count = EXCLUDED.late_count,
    absent_count = EXCLUDED.absent_count,
    posted_at = now();

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_quiz_result_grade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.marks_obtained IS NOT NULL THEN
    NEW.grade = calculate_grade(NEW.percentage);
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_timetable_overlaps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE class_id = NEW.class_id AND day = NEW.day AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
            (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
            (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Class scheduling conflict: This class already has a lesson during this time on %', NEW.day;
    END IF;

    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE teacher_id = NEW.teacher_id AND day = NEW.day AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
            (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
            (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Teacher scheduling conflict: This teacher is already assigned to another class during this time on %', NEW.day;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================
-- MISSING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid,
    date date NOT NULL,
    posted_by uuid NOT NULL,
    posted_at timestamp with time zone DEFAULT now(),
    total_students integer DEFAULT 0 NOT NULL,
    present_count integer DEFAULT 0 NOT NULL,
    late_count integer DEFAULT 0 NOT NULL,
    absent_count integer DEFAULT 0 NOT NULL,
    notes text
);

CREATE TABLE IF NOT EXISTS public.classes_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

CREATE TABLE IF NOT EXISTS public.lecture_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lecture_id uuid NOT NULL,
    user_id uuid,
    class_id uuid,
    access_type character varying(20) NOT NULL,
    granted_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lecture_access_access_type_check CHECK (((access_type)::text = ANY ((ARRAY['individual'::character varying, 'class'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.lecture_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lecture_id uuid NOT NULL,
    user_id uuid NOT NULL,
    view_type character varying(20) NOT NULL,
    viewed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lecture_views_view_type_check CHECK (((view_type)::text = ANY ((ARRAY['view'::character varying, 'download'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    duration_minutes integer DEFAULT 60,
    total_marks integer DEFAULT 100 NOT NULL,
    passing_marks integer DEFAULT 40,
    quiz_type text DEFAULT 'quiz'::text,
    status text DEFAULT 'scheduled'::text,
    instructions text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quizzes_quiz_type_check CHECK ((quiz_type = ANY (ARRAY['quiz'::text, 'test'::text, 'exam'::text, 'assignment'::text]))),
    CONSTRAINT quizzes_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'active'::text, 'completed'::text, 'cancelled'::text])))
);

CREATE TABLE IF NOT EXISTS public.quiz_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    student_id uuid NOT NULL,
    marks_obtained integer,
    total_marks integer NOT NULL,
    percentage numeric(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN ((marks_obtained IS NOT NULL) AND (total_marks > 0)) THEN round((((marks_obtained)::numeric / (total_marks)::numeric) * (100)::numeric), 2)
            ELSE NULL::numeric
        END) STORED,
    grade text,
    is_checked boolean DEFAULT false,
    submission_status text DEFAULT 'submitted'::text,
    remarks text,
    marked_by uuid,
    marked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quiz_results_submission_status_check CHECK ((submission_status = ANY (ARRAY['submitted'::text, 'late'::text, 'absent'::text])))
);

CREATE TABLE IF NOT EXISTS public.timetable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    day character varying(10) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL,
    room_number character varying(50) NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    CONSTRAINT timetable_day_check CHECK (((day)::text = ANY ((ARRAY['Monday'::character varying, 'Tuesday'::character varying, 'Wednesday'::character varying, 'Thursday'::character varying, 'Friday'::character varying, 'Saturday'::character varying])::text[]))),
    CONSTRAINT valid_time_range CHECK ((start_time < end_time))
);

-- ============================================================
-- FUNCTIONS (table-dependent)
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_quiz_result(result_id uuid, marks integer DEFAULT NULL::integer, remarks_text text DEFAULT NULL::text, is_absent boolean DEFAULT false) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_data quiz_results%ROWTYPE;
BEGIN
    SELECT * INTO result_data FROM quiz_results WHERE id = result_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Quiz result not found');
    END IF;

    IF is_absent THEN
        UPDATE quiz_results SET
            marks_obtained = NULL, is_checked = true,
            submission_status = 'absent',
            remarks = COALESCE(remarks_text, 'Student was absent'),
            marked_at = now(), updated_at = now()
        WHERE id = result_id;
    ELSE
        UPDATE quiz_results SET
            marks_obtained = marks, is_checked = true,
            submission_status = 'submitted',
            remarks = remarks_text,
            marked_at = now(), updated_at = now()
        WHERE id = result_id;
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.lecture_stats AS
 SELECT l.id, l.title, l.class_id, l.subject_id, l.uploaded_by, l.created_at, l.is_active,
    COALESCE(view_count.views, (0)::bigint) AS view_count,
    COALESCE(download_count.downloads, (0)::bigint) AS download_count,
    c.name AS class_name, s.name AS subject_name, p.full_name AS uploaded_by_name
   FROM (((((public.lectures l
     LEFT JOIN public.classes c ON ((c.id = l.class_id)))
     LEFT JOIN public.subjects s ON ((s.id = l.subject_id)))
     LEFT JOIN public.profiles p ON ((p.id = l.uploaded_by)))
     LEFT JOIN ( SELECT lecture_views.lecture_id, count(*) AS views
           FROM public.lecture_views WHERE ((lecture_views.view_type)::text = 'view'::text)
           GROUP BY lecture_views.lecture_id) view_count ON ((view_count.lecture_id = l.id)))
     LEFT JOIN ( SELECT lecture_views.lecture_id, count(*) AS downloads
           FROM public.lecture_views WHERE ((lecture_views.view_type)::text = 'download'::text)
           GROUP BY lecture_views.lecture_id) download_count ON ((download_count.lecture_id = l.id)));

CREATE OR REPLACE VIEW public.timetable_view AS
 SELECT t.id, t.day, t.start_time, t.end_time, t.subject_id, s.name AS subject_name,
    t.room_number, t.class_id, c.name AS class_name, t.teacher_id, p.full_name AS teacher_name,
    t.created_at, t.updated_at
   FROM (((public.timetable t
     JOIN public.subjects s ON ((t.subject_id = s.id)))
     JOIN public.classes c ON ((t.class_id = c.id)))
     JOIN public.profiles p ON ((t.teacher_id = p.id)))
  WHERE (t.deleted_at IS NULL)
  ORDER BY
        CASE t.day
            WHEN 'Monday'::text THEN 1
            WHEN 'Tuesday'::text THEN 2
            WHEN 'Wednesday'::text THEN 3
            WHEN 'Thursday'::text THEN 4
            WHEN 'Friday'::text THEN 5
            WHEN 'Saturday'::text THEN 6
            ELSE NULL::integer
        END, t.start_time;

-- ============================================================
-- PRIMARY KEYS & UNIQUE CONSTRAINTS (for new tables only)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subjects_pkey') THEN
    ALTER TABLE public.subjects ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subjects_name_key') THEN
    ALTER TABLE public.subjects ADD CONSTRAINT subjects_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_pkey') THEN
    ALTER TABLE public.attendance_sessions ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_class_id_date_key') THEN
    ALTER TABLE public.attendance_sessions ADD CONSTRAINT attendance_sessions_class_id_date_key UNIQUE (class_id, date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_subjects_pkey') THEN
    ALTER TABLE public.classes_subjects ADD CONSTRAINT classes_subjects_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_subjects_class_id_subject_id_key') THEN
    ALTER TABLE public.classes_subjects ADD CONSTRAINT classes_subjects_class_id_subject_id_key UNIQUE (class_id, subject_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecture_access_pkey') THEN
    ALTER TABLE public.lecture_access ADD CONSTRAINT lecture_access_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecture_views_pkey') THEN
    ALTER TABLE public.lecture_views ADD CONSTRAINT lecture_views_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecture_views_lecture_id_user_id_view_type_key') THEN
    ALTER TABLE public.lecture_views ADD CONSTRAINT lecture_views_lecture_id_user_id_view_type_key UNIQUE (lecture_id, user_id, view_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_pkey') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_pkey') THEN
    ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_quiz_id_student_id_key') THEN
    ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_results_quiz_id_student_id_key UNIQUE (quiz_id, student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_pkey') THEN
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_schedule') THEN
    ALTER TABLE public.timetable ADD CONSTRAINT unique_class_schedule UNIQUE (class_id, day, start_time, end_time) DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON public.attendance_sessions USING btree (class_id, date);
CREATE INDEX IF NOT EXISTS idx_classes_subjects_active ON public.classes_subjects USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_classes_subjects_class_id ON public.classes_subjects USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_classes_subjects_subject_id ON public.classes_subjects USING btree (subject_id);
CREATE INDEX IF NOT EXISTS idx_lecture_access_class_id ON public.lecture_access USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_lecture_access_lecture_id ON public.lecture_access USING btree (lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_access_user_id ON public.lecture_access USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_views_lecture_id ON public.lecture_views USING btree (lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_views_user_id ON public.lecture_views USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_is_checked ON public.quiz_results USING btree (is_checked);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results USING btree (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_student_id ON public.quiz_results USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON public.quizzes USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes USING btree (subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects USING btree (name);
CREATE INDEX IF NOT EXISTS idx_timetable_active ON public.timetable USING btree (deleted_at) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON public.timetable USING btree (class_id, day) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_timetable_subject ON public.timetable USING btree (subject_id) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.timetable USING btree (teacher_id) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_timetable_time_range ON public.timetable USING btree (day, start_time, end_time) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS students_email_unique ON public.students USING btree (email) WHERE ((is_deleted = false) AND (email IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_students_has_registered ON public.students USING btree (has_registered) WHERE (is_deleted = false);

-- ============================================================
-- FOREIGN KEYS (for new tables)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_class_id_fkey') THEN
    ALTER TABLE public.attendance_sessions ADD CONSTRAINT attendance_sessions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_posted_by_fkey') THEN
    ALTER TABLE public.attendance_sessions ADD CONSTRAINT attendance_sessions_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_subjects_class_id_fkey') THEN
    ALTER TABLE public.classes_subjects ADD CONSTRAINT classes_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_subjects_subject_id_fkey') THEN
    ALTER TABLE public.classes_subjects ADD CONSTRAINT classes_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_access_class_id') THEN
    ALTER TABLE public.lecture_access ADD CONSTRAINT fk_lecture_access_class_id FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_access_granted_by') THEN
    ALTER TABLE public.lecture_access ADD CONSTRAINT fk_lecture_access_granted_by FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_access_lecture_id') THEN
    ALTER TABLE public.lecture_access ADD CONSTRAINT fk_lecture_access_lecture_id FOREIGN KEY (lecture_id) REFERENCES public.lectures(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_access_user_id') THEN
    ALTER TABLE public.lecture_access ADD CONSTRAINT fk_lecture_access_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_views_lecture_id') THEN
    ALTER TABLE public.lecture_views ADD CONSTRAINT fk_lecture_views_lecture_id FOREIGN KEY (lecture_id) REFERENCES public.lectures(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lecture_views_user_id') THEN
    ALTER TABLE public.lecture_views ADD CONSTRAINT fk_lecture_views_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_class_id_fkey') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_created_by_fkey') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_subject_id_fkey') THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_marked_by_fkey') THEN
    ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_results_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_quiz_id_fkey') THEN
    ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_results_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_student_id_fkey') THEN
    ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_class_id_fkey') THEN
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_subject_id_fkey') THEN
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_teacher_id_fkey') THEN
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- TRIGGERS (for new tables; skip duplicates)
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_attendance_session_stats ON public.attendance;
CREATE TRIGGER trg_update_attendance_session_stats
    AFTER INSERT OR DELETE OR UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.update_attendance_session_stats();

DROP TRIGGER IF EXISTS trigger_update_quiz_result_grade ON public.quiz_results;
CREATE TRIGGER trigger_update_quiz_result_grade
    BEFORE UPDATE ON public.quiz_results
    FOR EACH ROW EXECUTE FUNCTION public.update_quiz_result_grade();

DROP TRIGGER IF EXISTS update_classes_subjects_updated_at ON public.classes_subjects;
CREATE TRIGGER update_classes_subjects_updated_at
    BEFORE UPDATE ON public.classes_subjects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lecture_access_updated_at ON public.lecture_access;
CREATE TRIGGER update_lecture_access_updated_at
    BEFORE UPDATE ON public.lecture_access
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS check_timetable_overlaps_trigger ON public.timetable;
CREATE TRIGGER check_timetable_overlaps_trigger
    BEFORE INSERT OR UPDATE ON public.timetable
    FOR EACH ROW EXECUTE FUNCTION public.check_timetable_overlaps();

DROP TRIGGER IF EXISTS update_timetable_updated_at ON public.timetable;
CREATE TRIGGER update_timetable_updated_at
    BEFORE UPDATE ON public.timetable
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their class timetable" ON public.timetable;
CREATE POLICY "Students can view their class timetable" ON public.timetable FOR SELECT
    USING (((deleted_at IS NULL) AND ((EXISTS ( SELECT 1
       FROM public.students s
      WHERE ((s.class_id = timetable.class_id) AND (s.id = auth.uid())))) OR (teacher_id = auth.uid()))));

DROP POLICY IF EXISTS "Teachers can manage their timetable entries" ON public.timetable;
CREATE POLICY "Teachers can manage their timetable entries" ON public.timetable
    USING (((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1
       FROM public.profiles p
      WHERE ((p.id = auth.uid()) AND (p.role = 'teacher'::text))))));
