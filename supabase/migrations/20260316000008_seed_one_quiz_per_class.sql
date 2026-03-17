-- Seed one quiz per class (using the first subject alphabetically for that class)
-- then create marked results for all enrolled students

DO $$
DECLARE
    r_class     RECORD;
    r_enroll    RECORD;
    r_student   RECORD;
    v_quiz_id   UUID;
    v_marks     INT;
BEGIN
    -- Loop over every class
    FOR r_class IN SELECT id, name FROM classes ORDER BY name LOOP

        -- Pick the first teacher_subject_enrollment for this class (alphabetically by subject name)
        SELECT tse.teacher_id, tse.subject_id, s.name AS subject_name
          INTO r_enroll
          FROM teacher_subject_enrollments tse
          JOIN subjects s ON s.id = tse.subject_id
         WHERE tse.class_id = r_class.id
           AND tse.is_active = true
         ORDER BY s.name
         LIMIT 1;

        -- Skip classes with no teacher assigned
        IF r_enroll IS NULL THEN
            CONTINUE;
        END IF;

        -- Insert the quiz
        INSERT INTO quizzes (
            title, description, subject_id, class_id,
            scheduled_date, duration_minutes, total_marks, passing_marks,
            quiz_type, status, created_by
        ) VALUES (
            r_class.name || ' — ' || r_enroll.subject_name || ' Quiz',
            'Sample quiz for ' || r_class.name,
            r_enroll.subject_id,
            r_class.id,
            CURRENT_DATE,
            60, 100, 40,
            'quiz', 'completed',
            r_enroll.teacher_id
        )
        RETURNING id INTO v_quiz_id;

        -- Create a marked result for every student enrolled in this class + subject
        FOR r_student IN
            SELECT sse.student_id
              FROM student_subject_enrollments sse
             WHERE sse.class_id    = r_class.id
               AND sse.subject_id  = r_enroll.subject_id
               AND sse.is_active   = true
        LOOP
            -- Random marks between 45 and 95
            v_marks := 45 + floor(random() * 51)::INT;

            INSERT INTO quiz_results (
                quiz_id, student_id, total_marks, marks_obtained,
                is_checked, submission_status,
                marked_by, marked_at
            ) VALUES (
                v_quiz_id,
                r_student.student_id,
                100,
                v_marks,
                true,
                'submitted',
                r_enroll.teacher_id,
                NOW()
            );
        END LOOP;

    END LOOP;
END $$;
