-- Add missing foreign key from lectures.subject_id → subjects.id
-- Without this FK, PostgREST cannot perform the subjects(name) join in queries.

ALTER TABLE public.lectures
    ADD CONSTRAINT lectures_subject_id_fkey
    FOREIGN KEY (subject_id)
    REFERENCES public.subjects(id)
    ON DELETE SET NULL;
