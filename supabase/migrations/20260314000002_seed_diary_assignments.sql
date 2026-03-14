-- Seed diary assignments with realistic conflict scenarios
-- Classes:  Class 8 = c1ce3dc4  | Class 9 = 028093f8  | Class 10 = bb494830
-- Teachers: Rafeh   = 832699b1  | Rizwana  = 72b7d443  | Sitara   = 503d8998
-- Subjects: Maths=60e0f0a9 | English=f835f66b | Physics=182f6b84
--           Biology=475d8508 | Chemistry=3ecd9026 | CS=b2ab910d
-- Students (Class 9): Danish=09f081b3 | Emaan=9b665ec9 | Ghazal=64fd0ac9 | T=4921c708
-- Students (Class 10): Hassan=2e62504a | Iram=6da88f53 | Junaid=0ee8ac81 | Kiran=160f0c6f
-- Students (Class 8):  Aisha=bfc20b7b | Bilal=4fafd6d9 | Fatima=be2ccee7

-- ─────────────────────────────────────────────────────────────────
-- CONFLICT SET 1: Class 9 — 4 assignments from 3 teachers on 2026-03-20
-- Every Class 9 student has Maths + English + Chemistry + Physics all due same day
-- ─────────────────────────────────────────────────────────────────

INSERT INTO diary_assignments (title, description, due_date, class_id, subject_id, assigned_by) VALUES
(
  'Algebra Worksheet',
  'Complete exercises 5.1 to 5.4 from your textbook. Show all working steps.',
  '2026-03-20',
  '028093f8-c48f-4238-bba2-0a3a96e665d3',  -- Class 9
  '60e0f0a9-1264-4163-a482-6854fbe1196b',  -- Maths
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
),
(
  'Essay: Impact of Technology on Education',
  'Write a 500-word essay arguing for or against the use of technology in classrooms. Include at least 3 examples.',
  '2026-03-20',
  '028093f8-c48f-4238-bba2-0a3a96e665d3',  -- Class 9
  'f835f66b-13d0-4456-af94-83fff585cff5',  -- English
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
),
(
  'Lab Report: Acid-Base Reactions',
  'Write the full lab report for yesterday''s titration experiment. Include observations, calculations, and conclusion.',
  '2026-03-20',
  '028093f8-c48f-4238-bba2-0a3a96e665d3',  -- Class 9
  '3ecd9026-bdd3-46e2-99cf-aec7fb83b746',  -- Chemistry
  '503d8998-7091-4d5e-a423-17aef329a03e'   -- Sitara
),
(
  'Motion & Forces Problem Set',
  'Solve problems 1 through 12 from Chapter 3 (Newton''s Laws). Diagrams are required for every question.',
  '2026-03-20',
  '028093f8-c48f-4238-bba2-0a3a96e665d3',  -- Class 9
  '182f6b84-bea0-4529-8f35-76303b7f9d32',  -- Physics
  '72b7d443-61d4-446c-a53b-825eb3e29900'   -- Rizwana
);

-- ─────────────────────────────────────────────────────────────────
-- CONFLICT SET 2: Danish Ahmed gets a personal Maths assignment
-- on 2026-03-25 — the SAME day Rafeh assigns a class-wide Maths task
-- Danish sees BOTH assignments on that day
-- ─────────────────────────────────────────────────────────────────

INSERT INTO diary_assignments (title, description, due_date, class_id, subject_id, assigned_by) VALUES
(
  'Geometry Chapter Review',
  'Revise all theorems from Chapter 6 (Triangles & Circles). Complete the practice questions at the end of the chapter.',
  '2026-03-25',
  '028093f8-c48f-4238-bba2-0a3a96e665d3',  -- Class 9 (class-wide)
  '60e0f0a9-1264-4163-a482-6854fbe1196b',  -- Maths
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
);

INSERT INTO diary_assignments (title, description, due_date, student_id, subject_id, assigned_by) VALUES
(
  'Remedial: Geometry Extra Practice',
  'Danish — you need to redo the triangle congruence problems from last week. Complete the supplementary worksheet provided.',
  '2026-03-25',
  '09f081b3-2256-4833-975f-a530dac42f70',  -- Danish Ahmed (personal)
  '60e0f0a9-1264-4163-a482-6854fbe1196b',  -- Maths
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
);

-- ─────────────────────────────────────────────────────────────────
-- CONFLICT SET 3: Class 10 — CS + Chemistry due same day (2026-03-22)
-- PLUS Hassan Raza gets a personal Biology assignment on the same date
-- Hassan has 3 things due on 2026-03-22
-- ─────────────────────────────────────────────────────────────────

INSERT INTO diary_assignments (title, description, due_date, class_id, subject_id, assigned_by) VALUES
(
  'Database Design Project',
  'Design an ER diagram for a school management system. Include at least 6 entities with proper relationships and cardinality.',
  '2026-03-22',
  'bb494830-fb23-46e9-9338-63f89cca81b0',  -- Class 10
  'b2ab910d-e53f-4066-8491-8cd43ae1d843',  -- Computer Science
  '503d8998-7091-4d5e-a423-17aef329a03e'   -- Sitara
),
(
  'Organic Chemistry: Functional Groups',
  'Prepare summary notes on all 8 functional groups covered in Chapter 9. Include structural formulas and naming rules.',
  '2026-03-22',
  'bb494830-fb23-46e9-9338-63f89cca81b0',  -- Class 10
  '3ecd9026-bdd3-46e2-99cf-aec7fb83b746',  -- Chemistry
  '503d8998-7091-4d5e-a423-17aef329a03e'   -- Sitara
);

INSERT INTO diary_assignments (title, description, due_date, student_id, subject_id, assigned_by) VALUES
(
  'Remedial: Cell Biology Diagrams',
  'Hassan — redraw and label the diagrams for mitosis and meiosis. Add detailed annotations for each stage.',
  '2026-03-22',
  '2e62504a-14c8-461e-a687-eb2b3fe80c69',  -- Hassan Raza (personal)
  '475d8508-400d-4004-87a9-f2c895faf552',  -- Biology
  '72b7d443-61d4-446c-a53b-825eb3e29900'   -- Rizwana
);

-- ─────────────────────────────────────────────────────────────────
-- NORMAL assignments (no conflict, spread across classes)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO diary_assignments (title, description, due_date, class_id, subject_id, assigned_by) VALUES
(
  'Quadratic Equations Practice',
  'Complete the exercise set on quadratic formula and factorization. All 20 problems must be attempted.',
  '2026-03-28',
  'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c',  -- Class 8
  '60e0f0a9-1264-4163-a482-6854fbe1196b',  -- Maths
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
),
(
  'Book Review: Animal Farm',
  'Write a one-page review of Animal Farm covering theme, characters, and your personal opinion.',
  '2026-03-28',
  'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c',  -- Class 8
  'f835f66b-13d0-4456-af94-83fff585cff5',  -- English
  '832699b1-72c2-45eb-86ca-c1edcce655fd'   -- Rafeh
),
(
  'Physics: Wave Properties Notes',
  'Read Chapter 7 and prepare handwritten notes on wave speed, frequency, and wavelength. Include at least 5 solved examples.',
  '2026-03-26',
  'bb494830-fb23-46e9-9338-63f89cca81b0',  -- Class 10
  '182f6b84-bea0-4529-8f35-76303b7f9d32',  -- Physics
  '72b7d443-61d4-446c-a53b-825eb3e29900'   -- Rizwana
);
