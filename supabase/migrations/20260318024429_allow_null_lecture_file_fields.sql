-- Allow all file-related columns to be null (file attachment is optional)
ALTER TABLE lectures ALTER COLUMN file_type DROP NOT NULL;
ALTER TABLE lectures ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE lectures ALTER COLUMN file_size DROP NOT NULL;
