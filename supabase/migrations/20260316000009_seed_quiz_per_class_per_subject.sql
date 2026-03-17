-- Clear previous seed data
DELETE FROM quiz_results;
DELETE FROM quizzes;

-- One quiz per class per subject, all students marked
DO $$
DECLARE
    r_enroll    RECORD;
    r_student   RECORD;
    v_quiz_id   UUID;
    v_marks     INT;
BEGIN
    -- Loop over every unique class + subject that has a teacher assigned
    FOR r_enroll IN
        SELECT DISTINCT ON (tse.class_id, tse.subject_id)
               tse.class_id,
               tse.subject_id,
               tse.teacher_id,
               c.name  AS class_name,
               s.name  AS subject_name
          FROM teacher_subject_enrollments tse
          JOIN classes  c ON c.id = tse.class_id
          JOIN subjects s ON s.id = tse.subject_id
         WHERE tse.is_active = true
         ORDER BY tse.class_id, tse.subject_id, tse.teacher_id
    LOOP
        -- Insert one quiz for this class + subject
        INSERT INTO quizzes (
            title, description,
            subject_id, class_id,
            scheduled_date, duration_minutes,
            total_marks, passing_marks,
            quiz_type, status, created_by
        ) VALUES (
            r_enroll.class_name || ' — ' || r_enroll.subject_name || ' Quiz',
            'Quiz for ' || r_enroll.subject_name || ' in ' || r_enroll.class_name,
            r_enroll.subject_id,
            r_enroll.class_id,
            CURRENT_DATE,
            60, 100, 40,
            'quiz', 'completed',
            r_enroll.teacher_id
        )
        RETURNING id INTO v_quiz_id;

        -- Mark every student enrolled in this class + subject
        FOR r_student IN
            SELECT sse.student_id
              FROM student_subject_enrollments sse
             WHERE sse.class_id   = r_enroll.class_id
               AND sse.subject_id = r_enroll.subject_id
               AND sse.is_active  = true
        LOOP
            v_marks := 45 + floor(random() * 51)::INT;  -- 45–95

            INSERT INTO quiz_results (
                quiz_id, student_id,
                total_marks, marks_obtained,
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
