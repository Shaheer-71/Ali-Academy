-- Add foreign key from notifications.created_by → profiles.id
-- so PostgREST can resolve the creator join

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_created_by_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
