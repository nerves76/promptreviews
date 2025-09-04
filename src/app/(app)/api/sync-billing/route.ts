/**
 * Manual Billing Sync API
 * 
 * Allows administrators to manually trigger billing synchronization
 * between Stripe and the database for consistency checks
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseClient";
import { syncAccountBilling, syncAllAccounts } from "@/lib/billing/sync";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { accountId, syncAll = false } = body;
    
    // If syncAll is true, sync all accounts (admin only)
    if (syncAll) {
      // Check if user is admin
      const { data: userAccount } = await supabase
        .from("accounts")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();
      
      if (!userAccount?.is_admin) {
        return NextResponse.json({ 
          error: "Admin access required for bulk sync" 
        }, { status: 403 });
      }
      
      const result = await syncAllAccounts();
      
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} accounts, ${result.failed} failed`,
        details: result,
      });
    }
    
    // Single account sync
    if (!accountId) {
      return NextResponse.json({ 
        error: "Account ID is required" 
      }, { status: 400 });
    }
    
    const result = await syncAccountBilling(accountId);
    
    if (!result.success) {
      return NextResponse.json({
        error: result.error || "Sync failed",
        accountId,
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: result.changes?.length 
        ? `Updated ${result.changes.length} field(s)` 
        : "No changes needed",
      changes: result.changes,
      accountId,
    });
    
  } catch (error: any) {
    console.error("Sync API error:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to sync billing data",
    endpoints: {
      singleAccount: "POST with { accountId: 'uuid' }",
      allAccounts: "POST with { syncAll: true } (admin only)",
    },
  });
}