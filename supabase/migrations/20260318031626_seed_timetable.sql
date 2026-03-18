-- Seed timetable with a realistic, conflict-free weekly schedule
-- Teachers:  Rafeh Siddiqui (Math, English) | Rizwana Bibi (Physics, Biology) | Sitara Naz (Chemistry, CS)
-- Classes:   Class 8 | Class 9 | Class 10
-- Rule: per (day, time-slot) → each teacher teaches exactly one class, each class has exactly one teacher

SET session_replication_role = 'replica';

INSERT INTO timetable (day, class_id, subject_id, teacher_id, start_time, end_time, room_number) VALUES

-- ── MONDAY ────────────────────────────────────────────────────────────────────
-- 16:00–16:45
('Monday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '16:00', '16:45', 'Room 101'),  -- Class 8  | Math      | Rafeh
('Monday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '16:00', '16:45', 'Room 201'),  -- Class 9  | Physics   | Rizwana
('Monday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '16:00', '16:45', 'Room 301'),  -- Class 10 | Chemistry | Sitara
-- 17:00–17:45
('Monday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '17:00', '17:45', 'Room 102'),  -- Class 9  | Math      | Rafeh
('Monday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '17:00', '17:45', 'Room 202'),  -- Class 10 | Physics   | Rizwana
('Monday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '17:00', '17:45', 'Room 302'),  -- Class 8  | Chemistry | Sitara
-- 18:00–18:45
('Monday', 'bb494830-fb23-46e9-9338-63f89cca81b0', 'f835f66b-13d0-4456-af94-83fff585cff5', '832699b1-72c2-45eb-86ca-c1edcce655fd', '18:00', '18:45', 'Room 103'),  -- Class 10 | English   | Rafeh
('Monday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '18:00', '18:45', 'Room 203'),  -- Class 8  | Biology   | Rizwana
('Monday', '028093f8-c48f-4238-bba2-0a3a96e665d3', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '18:00', '18:45', 'Room 303'),  -- Class 9  | CS        | Sitara

-- ── TUESDAY ───────────────────────────────────────────────────────────────────
-- 16:00–16:45
('Tuesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', 'f835f66b-13d0-4456-af94-83fff585cff5', '832699b1-72c2-45eb-86ca-c1edcce655fd', '16:00', '16:45', 'Room 101'),  -- Class 9  | English   | Rafeh
('Tuesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '16:00', '16:45', 'Room 201'),  -- Class 8  | Biology   | Rizwana
('Tuesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '16:00', '16:45', 'Room 301'),  -- Class 10 | CS        | Sitara
-- 17:00–17:45
('Tuesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '17:00', '17:45', 'Room 102'),  -- Class 10 | Math      | Rafeh
('Tuesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '17:00', '17:45', 'Room 202'),  -- Class 9  | Biology   | Rizwana
('Tuesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '17:00', '17:45', 'Room 302'),  -- Class 8  | CS        | Sitara
-- 18:00–18:45
('Tuesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', 'f835f66b-13d0-4456-af94-83fff585cff5', '832699b1-72c2-45eb-86ca-c1edcce655fd', '18:00', '18:45', 'Room 103'),  -- Class 8  | English   | Rafeh
('Tuesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '18:00', '18:45', 'Room 203'),  -- Class 10 | Physics   | Rizwana
('Tuesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '18:00', '18:45', 'Room 303'),  -- Class 9  | Chemistry | Sitara

-- ── WEDNESDAY ─────────────────────────────────────────────────────────────────
-- 16:00–16:45
('Wednesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '16:00', '16:45', 'Room 101'),  -- Class 8  | Math      | Rafeh
('Wednesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '16:00', '16:45', 'Room 201'),  -- Class 10 | Biology   | Rizwana
('Wednesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '16:00', '16:45', 'Room 301'),  -- Class 9  | CS        | Sitara
-- 17:00–17:45
('Wednesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', 'f835f66b-13d0-4456-af94-83fff585cff5', '832699b1-72c2-45eb-86ca-c1edcce655fd', '17:00', '17:45', 'Room 102'),  -- Class 9  | English   | Rafeh
('Wednesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '17:00', '17:45', 'Room 202'),  -- Class 8  | Physics   | Rizwana
('Wednesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '17:00', '17:45', 'Room 302'),  -- Class 10 | Chemistry | Sitara
-- 18:00–18:45
('Wednesday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '18:00', '18:45', 'Room 103'),  -- Class 10 | Math      | Rafeh
('Wednesday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '18:00', '18:45', 'Room 203'),  -- Class 9  | Biology   | Rizwana
('Wednesday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '18:00', '18:45', 'Room 303'),  -- Class 8  | CS        | Sitara

-- ── THURSDAY ──────────────────────────────────────────────────────────────────
-- 16:00–16:45
('Thursday', 'bb494830-fb23-46e9-9338-63f89cca81b0', 'f835f66b-13d0-4456-af94-83fff585cff5', '832699b1-72c2-45eb-86ca-c1edcce655fd', '16:00', '16:45', 'Room 101'),  -- Class 10 | English   | Rafeh
('Thursday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '16:00', '16:45', 'Room 201'),  -- Class 8  | Biology   | Rizwana
('Thursday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '16:00', '16:45', 'Room 301'),  -- Class 9  | Chemistry | Sitara
-- 17:00–17:45
('Thursday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '17:00', '17:45', 'Room 102'),  -- Class 8  | Math      | Rafeh
('Thursday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '17:00', '17:45', 'Room 202'),  -- Class 9  | Physics   | Rizwana
('Thursday', 'bb494830-fb23-46e9-9338-63f89cca81b0', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '17:00', '17:45', 'Room 302'),  -- Class 10 | CS        | Sitara
-- 18:00–18:45
('Thursday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '18:00', '18:45', 'Room 103'),  -- Class 9  | Math      | Rafeh
('Thursday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '18:00', '18:45', 'Room 203'),  -- Class 10 | Physics   | Rizwana

-- ── FRIDAY ────────────────────────────────────────────────────────────────────
-- 16:00–16:45
('Friday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '16:00', '16:45', 'Room 101'),  -- Class 8  | Math      | Rafeh
('Friday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '475d8508-400d-4004-87a9-f2c895faf552', '72b7d443-61d4-446c-a53b-825eb3e29900', '16:00', '16:45', 'Room 201'),  -- Class 9  | Biology   | Rizwana
('Friday', 'bb494830-fb23-46e9-9338-63f89cca81b0', 'b2ab910d-e53f-4066-8491-8cd43ae1d843', '503d8998-7091-4d5e-a423-17aef329a03e', '16:00', '16:45', 'Room 301'),  -- Class 10 | CS        | Sitara
-- 17:00–17:45
('Friday', '028093f8-c48f-4238-bba2-0a3a96e665d3', '60e0f0a9-1264-4163-a482-6854fbe1196b', '832699b1-72c2-45eb-86ca-c1edcce655fd', '17:00', '17:45', 'Room 102'),  -- Class 9  | Math      | Rafeh
('Friday', 'bb494830-fb23-46e9-9338-63f89cca81b0', '182f6b84-bea0-4529-8f35-76303b7f9d32', '72b7d443-61d4-446c-a53b-825eb3e29900', '17:00', '17:45', 'Room 202'),  -- Class 10 | Physics   | Rizwana
('Friday', 'c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c', '3ecd9026-bdd3-46e2-99cf-aec7fb83b746', '503d8998-7091-4d5e-a423-17aef329a03e', '17:00', '17:45', 'Room 302');  -- Class 8  | Chemistry | Sitara

RESET session_replication_role;
