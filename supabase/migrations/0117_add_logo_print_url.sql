-- Add logo_print_url column to businesses table for high-quality print versions
ALTER TABLE businesses ADD COLUMN logo_print_url TEXT;

-- Add comment to explain the purpose
COMMENT ON COLUMN businesses.logo_print_url IS 'High-quality version of business logo optimized for print materials (QR codes, etc.)'; 