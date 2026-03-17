-- 1. Delete all quiz results first (foreign key dependency)
DELETE FROM quiz_results;

-- 2. Delete all quizzes
DELETE FROM quizzes;

-- 3. Add unique constraint: one quiz per class+subject combination
ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_class_subject_unique UNIQUE (class_id, subject_id);
