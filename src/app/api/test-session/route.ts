import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user?.email || null,
      sessionId: session?.access_token?.substring(0, 20) + '...' || null,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      hasSession: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}