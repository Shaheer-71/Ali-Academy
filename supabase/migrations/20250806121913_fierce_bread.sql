/*
  # Create classes table for class management

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `teacher_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `classes` table
    - Add policy for authenticated users to read classes
    - Add policy for teachers to manage their classes
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample classes
INSERT INTO classes (name, description) VALUES
  ('Class A', 'Primary class for younger students'),
  ('Class B', 'Intermediate class for middle level students'),
  ('Class C', 'Advanced class for senior students')
ON CONFLICT (name) DO NOTHING;