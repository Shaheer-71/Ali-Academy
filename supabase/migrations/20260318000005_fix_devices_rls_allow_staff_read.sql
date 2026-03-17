-- Allow teachers, admins, and superadmins to read all device tokens
-- (needed to send push notifications to students)
CREATE POLICY "Staff can read all device tokens"
    ON devices
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'admin', 'superadmin')
        OR user_id = auth.uid()
    );
