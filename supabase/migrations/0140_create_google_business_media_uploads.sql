-- Create table for tracking Google Business Profile media uploads
CREATE TABLE google_business_media_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    google_media_name TEXT,
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE google_business_media_uploads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own media uploads
CREATE POLICY "Users can view own media uploads" ON google_business_media_uploads
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own media uploads
CREATE POLICY "Users can insert own media uploads" ON google_business_media_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own media uploads
CREATE POLICY "Users can update own media uploads" ON google_business_media_uploads
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own media uploads
CREATE POLICY "Users can delete own media uploads" ON google_business_media_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_google_business_media_uploads_user_id ON google_business_media_uploads(user_id);
CREATE INDEX idx_google_business_media_uploads_location_id ON google_business_media_uploads(location_id);
CREATE INDEX idx_google_business_media_uploads_created_at ON google_business_media_uploads(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_business_media_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_google_business_media_uploads_updated_at
    BEFORE UPDATE ON google_business_media_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_google_business_media_uploads_updated_at(); 