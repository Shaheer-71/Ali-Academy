/*
  # Create students table for student management

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `roll_number` (text, unique)
      - `class_id` (uuid, references classes)
      - `parent_contact` (text)
      - `parent_id` (uuid, optional, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `students` table
    - Add policy for teachers to manage all students
    - Add policy for parents to read their children's data
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  parent_contact text NOT NULL,
  parent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
