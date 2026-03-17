-- Enable realtime for notification_recipients so the client
-- subscription fires on INSERT and triggers local popups

ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
