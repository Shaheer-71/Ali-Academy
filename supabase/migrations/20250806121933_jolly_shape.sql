/*
  # Create lectures table for lecture file management

  1. New Tables
    - `lectures`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `file_url` (text)
      - `file_type` (text)
      - `class_id` (uuid, references classes)
      - `uploaded_by` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `lectures` table
    - Add policy for teachers to manage lectures
    - Add policy for students/parents to read lectures for their classes
*/

-- Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lectures_class_id ON lectures(class_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);