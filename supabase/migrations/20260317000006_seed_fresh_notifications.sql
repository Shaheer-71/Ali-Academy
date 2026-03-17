DO $$
DECLARE
    admin_id uuid;
    n1 uuid := gen_random_uuid();
    n2 uuid := gen_random_uuid();
    n3 uuid := gen_random_uuid();
BEGIN
    SELECT id INTO admin_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
    IF admin_id IS NULL THEN SELECT id INTO admin_id FROM profiles LIMIT 1; END IF;

    INSERT INTO notifications (id, title, message, type, priority, target_type, entity_type, created_by, created_at)
    VALUES
        (n1, 'Midterm Exams Next Week',
         'Midterm examinations are scheduled for next week. Make sure students have their hall tickets ready and timetables are confirmed.',
         'announcement', 'high', 'all', 'notification', admin_id, NOW() - INTERVAL '3 hours'),
        (n2, 'New Lecture: Physics Chapter 7',
         'A new lecture on Thermodynamics (Chapter 7) has been uploaded to the Lectures section. All Class 10 students should review it before Thursday.',
         'lecture_added', 'medium', 'all', 'notification', admin_id, NOW() - INTERVAL '45 minutes'),
        (n3, 'Timetable Change — Friday',
         'The Friday timetable has been updated. Period 3 (Mathematics) has been moved to Period 5. Please check the timetable for the updated schedule.',
         'timetable_changed', 'high', 'all', 'notification', admin_id, NOW() - INTERVAL '10 minutes');

    INSERT INTO notification_recipients (notification_id, user_id, is_read, is_deleted, created_at)
    SELECT n.id, p.id, false, false, NOW()
    FROM (VALUES (n1), (n2), (n3)) AS n(id)
    CROSS JOIN profiles p
    ON CONFLICT (notification_id, user_id) DO NOTHING;

    RAISE NOTICE 'Seeded 3 notifications for all profiles';
END $$;
