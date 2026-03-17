-- Extend notifications_target_type_check to include 'students' and 'teachers'
-- (the app sends these values; the old constraint only had 'all_students', 'all_teachers', etc.)

ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_target_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_target_type_check
    CHECK (target_type = ANY (ARRAY[
        'all',
        'students',
        'teachers',
        'individual',
        'all_students',
        'all_teachers',
        'class',
        'student'
    ]));
