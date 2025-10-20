-- Update profile-photos bucket to have smaller file size limit
-- Photos are automatically compressed to 300x300px WebP format (max ~500KB)

UPDATE storage.buckets
SET file_size_limit = 524288 -- 512KB limit
WHERE id = 'profile-photos';
