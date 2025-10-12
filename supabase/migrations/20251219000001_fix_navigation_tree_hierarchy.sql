-- Fix get_navigation_tree function to properly build hierarchical structure with nested children
-- This fixes the issue where subpages weren't showing in the docs site navigation

-- Helper function to build a node with its children recursively
CREATE OR REPLACE FUNCTION build_nav_node(node_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  node_data record;
  children_array jsonb;
BEGIN
  -- Get node data
  SELECT id, title, href, icon_name, order_index
  INTO node_data
  FROM navigation
  WHERE id = node_id AND is_active = true;

  -- If node doesn't exist, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get children recursively
  SELECT COALESCE(jsonb_agg(build_nav_node(id) ORDER BY order_index), '[]'::jsonb)
  INTO children_array
  FROM navigation
  WHERE parent_id = node_id AND is_active = true;

  -- Build and return the node
  RETURN jsonb_build_object(
    'id', node_data.id::text,
    'title', node_data.title,
    'href', node_data.href,
    'icon', node_data.icon_name,
    'children', children_array
  );
END;
$$;

-- Main function to get the navigation tree
CREATE OR REPLACE FUNCTION get_navigation_tree()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get all top-level nodes and build them recursively
  SELECT COALESCE(jsonb_agg(build_nav_node(id) ORDER BY order_index), '[]'::jsonb)
  INTO result
  FROM navigation
  WHERE parent_id IS NULL AND is_active = true;

  RETURN result;
END;
$$;

-- Add comments
COMMENT ON FUNCTION build_nav_node(uuid) IS
'Helper function that recursively builds a navigation node with all its nested children.';

COMMENT ON FUNCTION get_navigation_tree() IS
'Builds a hierarchical navigation tree from the navigation table. Returns top-level items with nested children at any depth. Each node includes id, title, href, icon, and children array.';
