-- Allow file_url to be null in lectures (file attachment is optional)
ALTER TABLE lectures ALTER COLUMN file_url DROP NOT NULL;
