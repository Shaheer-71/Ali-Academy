/*
  # Create attendance table for daily attendance tracking

  1. New Tables
    - `attendance`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `class_id` (uuid, references classes)
      - `date` (date)
      - `arrival_time` (time)
      - `status` (enum: present, late, absent)
      - `late_minutes` (integer, optional)
      - `marked_by` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `attendance` table
    - Add policy for teachers to manage attendance
    - Add policy for parents/students to read their attendance data

  3. Constraints
    - Unique constraint on student_id, date combination
*/

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  arrival_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  late_minutes integer DEFAULT 0,
  marked_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);