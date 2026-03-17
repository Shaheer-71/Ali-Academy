-- Fix: notifications table has RLS enabled but no SELECT policy,
-- causing the join in NotificationContext to silently return empty results.

DROP POLICY IF EXISTS "Authenticated users can read notifications" ON public.notifications;
CREATE POLICY "Authenticated users can read notifications" ON public.notifications
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);
