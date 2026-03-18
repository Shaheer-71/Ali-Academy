-- Delete all timetable data (both soft-deleted and active) then re-seed correctly
-- Each (day, time_slot) has exactly 3 entries: one per class, one per teacher — zero conflicts

SET session_replication_role = 'replica';

DELETE FROM timetable;

-- IDs reference:
-- Teachers: Rafeh=832699b1 (Math,English) | Rizwana=72b7d443 (Physics,Biology) | Sitara=503d8998 (Chemistry,CS)
-- Classes:  Class8=c1ce3dc4 | Class9=028093f8 | Class10=bb494830
-- Subjects: Math=60e0f0a9 | English=f835f66b | Physics=182f6b84 | Biology=475d8508 | Chemistry=3ecd9026 | CS=b2ab910d

INSERT INTO timetable (day, class_id, subject_id, teacher_id, start_time, end_time, room_number) VALUES

-- ── MONDAY ────────────────────────────────────────────────────────────────────
('Monday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','16:00','16:45','Room 101'), -- C8  Math      Rafeh
('Monday','028093f8-c48f-4238-bba2-0a3a96e665d3','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','16:00','16:45','Room 201'), -- C9  Physics   Rizwana
('Monday','bb494830-fb23-46e9-9338-63f89cca81b0','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','16:00','16:45','Room 301'), -- C10 Chemistry Sitara

('Monday','028093f8-c48f-4238-bba2-0a3a96e665d3','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','17:00','17:45','Room 102'), -- C9  Math      Rafeh
('Monday','bb494830-fb23-46e9-9338-63f89cca81b0','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','17:00','17:45','Room 202'), -- C10 Physics   Rizwana
('Monday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','17:00','17:45','Room 302'), -- C8  Chemistry Sitara

('Monday','bb494830-fb23-46e9-9338-63f89cca81b0','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','18:00','18:45','Room 103'), -- C10 English   Rafeh
('Monday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','18:00','18:45','Room 203'), -- C8  Biology   Rizwana
('Monday','028093f8-c48f-4238-bba2-0a3a96e665d3','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','18:00','18:45','Room 303'), -- C9  CS        Sitara

-- ── TUESDAY ───────────────────────────────────────────────────────────────────
('Tuesday','028093f8-c48f-4238-bba2-0a3a96e665d3','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','16:00','16:45','Room 101'), -- C9  English   Rafeh
('Tuesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','16:00','16:45','Room 201'), -- C8  Biology   Rizwana
('Tuesday','bb494830-fb23-46e9-9338-63f89cca81b0','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','16:00','16:45','Room 301'), -- C10 CS        Sitara

('Tuesday','bb494830-fb23-46e9-9338-63f89cca81b0','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','17:00','17:45','Room 102'), -- C10 Math      Rafeh
('Tuesday','028093f8-c48f-4238-bba2-0a3a96e665d3','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','17:00','17:45','Room 202'), -- C9  Biology   Rizwana
('Tuesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','17:00','17:45','Room 302'), -- C8  CS        Sitara

('Tuesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','18:00','18:45','Room 103'), -- C8  English   Rafeh
('Tuesday','bb494830-fb23-46e9-9338-63f89cca81b0','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','18:00','18:45','Room 203'), -- C10 Physics   Rizwana
('Tuesday','028093f8-c48f-4238-bba2-0a3a96e665d3','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','18:00','18:45','Room 303'), -- C9  Chemistry Sitara

-- ── WEDNESDAY ─────────────────────────────────────────────────────────────────
('Wednesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','16:00','16:45','Room 101'), -- C8  Math      Rafeh
('Wednesday','bb494830-fb23-46e9-9338-63f89cca81b0','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','16:00','16:45','Room 201'), -- C10 Biology   Rizwana
('Wednesday','028093f8-c48f-4238-bba2-0a3a96e665d3','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','16:00','16:45','Room 301'), -- C9  CS        Sitara

('Wednesday','028093f8-c48f-4238-bba2-0a3a96e665d3','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','17:00','17:45','Room 102'), -- C9  English   Rafeh
('Wednesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','17:00','17:45','Room 202'), -- C8  Physics   Rizwana
('Wednesday','bb494830-fb23-46e9-9338-63f89cca81b0','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','17:00','17:45','Room 302'), -- C10 Chemistry Sitara

('Wednesday','bb494830-fb23-46e9-9338-63f89cca81b0','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','18:00','18:45','Room 103'), -- C10 Math      Rafeh
('Wednesday','028093f8-c48f-4238-bba2-0a3a96e665d3','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','18:00','18:45','Room 203'), -- C9  Biology   Rizwana
('Wednesday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','18:00','18:45','Room 303'), -- C8  CS        Sitara

-- ── THURSDAY ──────────────────────────────────────────────────────────────────
('Thursday','bb494830-fb23-46e9-9338-63f89cca81b0','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','16:00','16:45','Room 101'), -- C10 English   Rafeh
('Thursday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','16:00','16:45','Room 201'), -- C8  Biology   Rizwana
('Thursday','028093f8-c48f-4238-bba2-0a3a96e665d3','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','16:00','16:45','Room 301'), -- C9  Chemistry Sitara

('Thursday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','17:00','17:45','Room 102'), -- C8  Math      Rafeh
('Thursday','028093f8-c48f-4238-bba2-0a3a96e665d3','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','17:00','17:45','Room 202'), -- C9  Physics   Rizwana
('Thursday','bb494830-fb23-46e9-9338-63f89cca81b0','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','17:00','17:45','Room 302'), -- C10 CS        Sitara

('Thursday','028093f8-c48f-4238-bba2-0a3a96e665d3','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','18:00','18:45','Room 103'), -- C9  Math      Rafeh
('Thursday','bb494830-fb23-46e9-9338-63f89cca81b0','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','18:00','18:45','Room 203'), -- C10 Physics   Rizwana
('Thursday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','18:00','18:45','Room 303'), -- C8  CS        Sitara

-- ── FRIDAY ────────────────────────────────────────────────────────────────────
('Friday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','16:00','16:45','Room 101'), -- C8  Math      Rafeh
('Friday','028093f8-c48f-4238-bba2-0a3a96e665d3','475d8508-400d-4004-87a9-f2c895faf552','72b7d443-61d4-446c-a53b-825eb3e29900','16:00','16:45','Room 201'), -- C9  Biology   Rizwana
('Friday','bb494830-fb23-46e9-9338-63f89cca81b0','b2ab910d-e53f-4066-8491-8cd43ae1d843','503d8998-7091-4d5e-a423-17aef329a03e','16:00','16:45','Room 301'), -- C10 CS        Sitara

('Friday','028093f8-c48f-4238-bba2-0a3a96e665d3','60e0f0a9-1264-4163-a482-6854fbe1196b','832699b1-72c2-45eb-86ca-c1edcce655fd','17:00','17:45','Room 102'), -- C9  Math      Rafeh
('Friday','bb494830-fb23-46e9-9338-63f89cca81b0','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','17:00','17:45','Room 202'), -- C10 Physics   Rizwana
('Friday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','17:00','17:45','Room 302'), -- C8  Chemistry Sitara

('Friday','bb494830-fb23-46e9-9338-63f89cca81b0','f835f66b-13d0-4456-af94-83fff585cff5','832699b1-72c2-45eb-86ca-c1edcce655fd','18:00','18:45','Room 103'), -- C10 English   Rafeh
('Friday','c1ce3dc4-5ecf-4ad0-aab9-2256615b7f8c','182f6b84-bea0-4529-8f35-76303b7f9d32','72b7d443-61d4-446c-a53b-825eb3e29900','18:00','18:45','Room 203'), -- C8  Physics   Rizwana
('Friday','028093f8-c48f-4238-bba2-0a3a96e665d3','3ecd9026-bdd3-46e2-99cf-aec7fb83b746','503d8998-7091-4d5e-a423-17aef329a03e','18:00','18:45','Room 303'); -- C9  Chemistry Sitara

RESET session_replication_role;
