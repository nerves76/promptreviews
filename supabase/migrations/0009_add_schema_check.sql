-- Create a function to get table schema
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
        )
    ) INTO result
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 