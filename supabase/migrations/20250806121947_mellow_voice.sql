/*
  # Seed demo data for testing

  1. Demo Users
    - Create demo teacher and parent accounts
    - Insert corresponding profiles

  2. Demo Students
    - Create sample students linked to classes
    - Associate with parent contacts

  3. Demo Classes
    - Ensure classes exist with proper teacher assignments

  Note: This is for development/demo purposes only
*/

-- Insert demo profiles (these would normally be created via app signup)
INSERT INTO profiles (id, email, full_name, role, contact_number) VALUES
  ('20116d81-58d4-4dec-bf87-969d6fd17c84', 'teacher@academy.com', 'Ms. Sarah Johnson', 'teacher', '+1234567890'),
  ('20116d81-58d4-4dec-bf87-969d6fd17c84', 'parent@academy.com', 'Mr. John Smith', 'parent', '+1234567891')
ON CONFLICT (email) DO NOTHING;

-- Update classes with teacher assignments
UPDATE classes SET teacher_id = '20116d81-58d4-4dec-bf87-969d6fd17c84' WHERE teacher_id IS NULL;

-- Insert demo students
INSERT INTO students (full_name, roll_number, class_id, parent_contact, parent_id) VALUES
  ('Emma Smith', 'A001', (SELECT id FROM classes WHERE name = 'Class A' LIMIT 1), '+1234567891', '20116d81-58d4-4dec-bf87-969d6fd17c84'),
  ('Liam Johnson', 'A002', (SELECT id FROM classes WHERE name = 'Class A' LIMIT 1), '+1234567892', NULL),
  ('Olivia Brown', 'A003', (SELECT id FROM classes WHERE name = 'Class A' LIMIT 1), '+1234567893', NULL),
  ('Noah Davis', 'B001', (SELECT id FROM classes WHERE name = 'Class B' LIMIT 1), '+1234567894', NULL),
  ('Ava Wilson', 'B002', (SELECT id FROM classes WHERE name = 'Class B' LIMIT 1), '+1234567895', NULL),
  ('Ethan Miller', 'C001', (SELECT id FROM classes WHERE name = 'Class C' LIMIT 1), '+1234567896', NULL)
ON CONFLICT (roll_number) DO NOTHING;

-- Insert sample attendance records for the current month
DO $$
DECLARE
  student_record RECORD;
  date_counter DATE;
  random_status TEXT;
  arrival_times TEXT[] := ARRAY['15:55', '15:58', '16:05', '16:10', '16:15', '16:20'];
BEGIN
  FOR student_record IN (SELECT id, class_id FROM students LIMIT 3) LOOP
    FOR i IN 1..15 LOOP
      date_counter := CURRENT_DATE - INTERVAL '15 days' + INTERVAL '1 day' * i;
      
      -- Skip weekends
      IF EXTRACT(DOW FROM date_counter) NOT IN (0, 6) THEN
        -- Random status (mostly present)
        CASE (RANDOM() * 10)::INT
          WHEN 0, 1 THEN random_status := 'absent';
          WHEN 2, 3 THEN random_status := 'late';
          ELSE random_status := 'present';
        END CASE;
        
        INSERT INTO attendance (
          student_id, 
          class_id, 
          date, 
          arrival_time, 
          status, 
          late_minutes,
          marked_by
        ) VALUES (
          student_record.id,
          student_record.class_id,
          date_counter,
          arrival_times[(RANDOM() * 5 + 1)::INT]::time,
          random_status,
          CASE WHEN random_status = 'late' THEN (RANDOM() * 30 + 5)::INT ELSE 0 END,
          '20116d81-58d4-4dec-bf87-969d6fd17c84'
        )
        ON CONFLICT (student_id, date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample lectures
INSERT INTO lectures (title, description, file_url, file_type, class_id, uploaded_by) VALUES
  ('Mathematics - Algebra Basics', 'Introduction to algebraic expressions and equations', 'https://example.com/math-algebra.pdf', 'application/pdf', (SELECT id FROM classes WHERE name = 'Class A' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84'),
  ('Physics - Laws of Motion', 'Understanding Newton''s three laws of motion with examples', 'https://example.com/physics-motion.pdf', 'application/pdf', (SELECT id FROM classes WHERE name = 'Class B' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84'),
  ('Chemistry - Organic Compounds', 'Basic organic chemistry concepts and molecular structures', 'https://example.com/chemistry-organic.pdf', 'application/pdf', (SELECT id FROM classes WHERE name = 'Class C' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84')
ON CONFLICT DO NOTHING;

-- Insert sample diary assignments
INSERT INTO diary_assignments (title, description, due_date, class_id, assigned_by) VALUES
  ('Math Practice Problems', 'Complete exercises 1-20 from chapter 5. Show all working steps clearly.', CURRENT_DATE + INTERVAL '3 days', (SELECT id FROM classes WHERE name = 'Class A' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84'),
  ('Physics Lab Report', 'Write a detailed report on the pendulum experiment conducted in class.', CURRENT_DATE + INTERVAL '5 days', (SELECT id FROM classes WHERE name = 'Class B' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84'),
  ('Chemistry Project', 'Create a presentation on the applications of organic compounds in daily life.', CURRENT_DATE + INTERVAL '7 days', (SELECT id FROM classes WHERE name = 'Class C' LIMIT 1), '20116d81-58d4-4dec-bf87-969d6fd17c84')
ON CONFLICT DO NOTHING;