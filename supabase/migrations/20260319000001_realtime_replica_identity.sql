-- Fix: Supabase Realtime with row-level filters requires REPLICA IDENTITY FULL
-- so that the full row is written to the WAL log, not just the primary key.
-- Without this, the `user_id=eq.${userId}` filter can never be evaluated,
-- and realtime INSERT events are silently dropped for all subscribers.

ALTER TABLE public.notification_recipients REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
