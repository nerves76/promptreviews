-- Update profile-photos bucket file size limit
-- Photos are automatically compressed to 300x300px WebP format (max ~500KB)
-- This reduces the limit from 2MB to 512KB as a safety measure

UPDATE storage.buckets
SET file_size_limit = 524288 -- 512KB limit (was 2MB)
WHERE id = 'profile-photos';
