import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/utils/admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Validate JWT server-side with getUser() instead of getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get schema information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      return NextResponse.json({ error: "Failed to get schema info" }, { status: 500 });
    }

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      user: user.email
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
