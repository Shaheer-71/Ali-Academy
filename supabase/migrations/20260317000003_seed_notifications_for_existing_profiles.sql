-- Re-seed notifications and create recipients for all currently registered profiles

DO $$
DECLARE
    admin_id uuid;
    notif1_id uuid := '11111111-0001-0001-0001-000000000001';
    notif2_id uuid := '11111111-0001-0001-0001-000000000002';
    notif3_id uuid := '11111111-0001-0001-0001-000000000003';
    notif4_id uuid := '11111111-0001-0001-0001-000000000004';
    notif5_id uuid := '11111111-0001-0001-0001-000000000005';
    profile_count int;
BEGIN
    -- Get any admin profile to use as created_by
    SELECT id INTO admin_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM profiles WHERE role = 'teacher' LIMIT 1;
    END IF;

    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE 'Found % profiles, admin_id = %', profile_count, admin_id;

    -- Upsert notifications (fixed UUIDs so we can re-run safely)
    INSERT INTO notifications (id, title, message, type, priority, target_type, entity_type, created_by, created_at)
    VALUES
        (notif1_id, 'Welcome to Ali Academy!',
         'Your account is all set up. Explore your timetable, assignments, and more.',
         'announcement', 'high', 'all', 'notification', admin_id, NOW() - INTERVAL '1 day'),
        (notif2_id, 'New Lecture Uploaded',
         'A new Mathematics lecture (Chapter 5) has been uploaded. Tap to view.',
         'lecture_added', 'medium', 'all', 'notification', admin_id, NOW() - INTERVAL '5 hours'),
        (notif3_id, 'Quiz Scheduled',
         'A Physics quiz has been scheduled for this week. Get prepared!',
         'quiz_added', 'high', 'all', 'notification', admin_id, NOW() - INTERVAL '2 hours'),
        (notif4_id, 'Timetable Updated',
         'Your class timetable has changed. Please check the new schedule.',
         'timetable_changed', 'medium', 'all', 'notification', admin_id, NOW() - INTERVAL '30 minutes'),
        (notif5_id, 'Assignment Due Tomorrow',
         'Reminder: English essay assignment is due tomorrow. Submit on time.',
         'assignment_added', 'high', 'all', 'notification', admin_id, NOW() - INTERVAL '10 minutes')
    ON CONFLICT (id) DO NOTHING;

    -- Create recipient records for every profile (skip if already exists)
    INSERT INTO notification_recipients (notification_id, user_id, is_read, is_deleted, created_at)
    SELECT n.notif_id, p.id, false, false, NOW()
    FROM (VALUES
        (notif1_id),
        (notif2_id),
        (notif3_id),
        (notif4_id),
        (notif5_id)
    ) AS n(notif_id)
    CROSS JOIN profiles p
    ON CONFLICT (notification_id, user_id) DO NOTHING;

    RAISE NOTICE 'Done seeding notifications for % profiles', profile_count;
END $$;
