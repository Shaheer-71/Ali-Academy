-- Seed test notifications for all profiles
-- Inserts several notification types and creates recipients for every existing profile

DO $$
DECLARE
    admin_id uuid;
    notif1_id uuid := gen_random_uuid();
    notif2_id uuid := gen_random_uuid();
    notif3_id uuid := gen_random_uuid();
    notif4_id uuid := gen_random_uuid();
    notif5_id uuid := gen_random_uuid();
BEGIN
    -- Get superadmin profile id to use as created_by
    SELECT id INTO admin_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
    -- Fallback to any profile if no superadmin yet
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM profiles LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        RAISE NOTICE 'No profiles found — skipping notification seed';
        RETURN;
    END IF;

    -- Insert notifications
    INSERT INTO notifications (id, title, message, type, priority, target_type, entity_type, created_by, created_at)
    VALUES
        (
            notif1_id,
            'Welcome to Ali Academy!',
            'Your account is all set up. Explore your timetable, assignments, and more from the home screen.',
            'announcement',
            'high',
            'all',
            'notification',
            admin_id,
            NOW() - INTERVAL '1 day'
        ),
        (
            notif2_id,
            'New Lecture Added',
            'A new lecture on Mathematics Chapter 5 has been uploaded. Tap to view.',
            'lecture_added',
            'medium',
            'all',
            'notification',
            admin_id,
            NOW() - INTERVAL '5 hours'
        ),
        (
            notif3_id,
            'Quiz Scheduled',
            'A Physics quiz has been scheduled for this week. Make sure you are prepared!',
            'quiz_added',
            'high',
            'all',
            'notification',
            admin_id,
            NOW() - INTERVAL '2 hours'
        ),
        (
            notif4_id,
            'Timetable Updated',
            'The class timetable has been updated. Please check your new schedule.',
            'timetable_changed',
            'medium',
            'all',
            'notification',
            admin_id,
            NOW() - INTERVAL '30 minutes'
        ),
        (
            notif5_id,
            'Assignment Due Soon',
            'Reminder: English essay assignment is due tomorrow. Submit on time.',
            'assignment_added',
            'high',
            'all',
            'notification',
            admin_id,
            NOW() - INTERVAL '10 minutes'
        )
    ON CONFLICT (id) DO NOTHING;

    -- Create recipient records for every existing profile (unread by default)
    INSERT INTO notification_recipients (notification_id, user_id, is_read, is_deleted, created_at)
    SELECT n.id, p.id, false, false, NOW()
    FROM (VALUES
        (notif1_id),
        (notif2_id),
        (notif3_id),
        (notif4_id),
        (notif5_id)
    ) AS n(id)
    CROSS JOIN profiles p
    ON CONFLICT (notification_id, user_id) DO NOTHING;

END $$;
