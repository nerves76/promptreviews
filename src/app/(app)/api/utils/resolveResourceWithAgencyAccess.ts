import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve a resource, checking both direct account ownership and agency management.
 *
 * Same pattern as resolveBoardWithAgencyAccess but for wm_resources.
 */
export async function resolveResourceWithAgencyAccess(
  supabaseAdmin: SupabaseClient,
  resourceId: string,
  accountId: string
): Promise<{ id: string; account_id: string } | null> {
  // First try direct match (most common case)
  const { data: directResource } = await supabaseAdmin
    .from('wm_resources')
    .select('id, account_id')
    .eq('id', resourceId)
    .eq('account_id', accountId)
    .single();

  if (directResource) return directResource;

  // Check if the requesting account is an agency
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('id, is_agncy')
    .eq('id', accountId)
    .single();

  if (!account?.is_agncy) return null;

  // Find the resource regardless of account
  const { data: resource } = await supabaseAdmin
    .from('wm_resources')
    .select('id, account_id')
    .eq('id', resourceId)
    .single();

  if (!resource) return null;

  // Verify the resource's account is managed by this agency
  const { data: clientAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', resource.account_id)
    .eq('managing_agncy_id', accountId)
    .single();

  if (!clientAccount) return null;

  return resource;
}
