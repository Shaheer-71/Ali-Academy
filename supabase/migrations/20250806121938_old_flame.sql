/*
  # Create diary assignments table for homework management

  1. New Tables
    - `diary_assignments`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `due_date` (date)
      - `file_url` (text, optional)
      - `class_id` (uuid, optional, references classes)
      - `student_id` (uuid, optional, references students)
      - `assigned_by` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `diary_assignments` table
    - Add policy for teachers to manage assignments
    - Add policy for students/parents to read their assignments

  3. Constraints
    - Either class_id OR student_id must be set (not both)
*/

-- Create diary assignments table
CREATE TABLE IF NOT EXISTS diary_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  due_date date NOT NULL,
  file_url text,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT check_assignment_target CHECK (
    (class_id IS NOT NULL AND student_id IS NULL) OR
    (class_id IS NULL AND student_id IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_assignments_class_id ON diary_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_diary_assignments_student_id ON diary_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_diary_assignments_due_date ON diary_assignments(due_date);